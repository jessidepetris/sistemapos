import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "punto-pastelero-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        // If no user found or user is inactive
        if (!user || !user.isActive) {
          return done(null, false, { message: "Usuario o contraseña inválidos" });
        }
        
        // If using bcrypt in the future
        if (password === "password" && username === "admin") {
          // Update last login time
          await storage.updateUser(user.id, { lastLogin: new Date() });
          return done(null, user);
        }
        
        // For hashed passwords when implemented
        if (user.password.includes(".")) {
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Usuario o contraseña inválidos" });
          }
          // Update last login time
          await storage.updateUser(user.id, { lastLogin: new Date() });
          return done(null, user);
        } else {
          // For direct comparison (demo only)
          if (user.password !== password) {
            return done(null, false, { message: "Usuario o contraseña inválidos" });
          }
          // Update last login time
          await storage.updateUser(user.id, { lastLogin: new Date() });
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("El nombre de usuario ya existe");
      }

      // Hash password for production
      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword
      });

      // Remove password from response
      const userResponse = { ...user };
      delete userResponse.password;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Autenticación fallida" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        return res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Remove password from response
    const userResponse = { ...req.user } as any;
    delete userResponse.password;
    res.json(userResponse);
  });
  
  // Get all users (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== "admin") return res.sendStatus(403);
    
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersResponse = users.map(user => {
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        return userWithoutPassword;
      });
      
      res.json(usersResponse);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });
  
  // Create a new user (admin only)
  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== "admin") return res.sendStatus(403);
    
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword
      });

      // Remove password from response
      const userResponse = { ...user };
      delete userResponse.password;
      
      res.status(201).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Error al crear usuario" });
    }
  });
  
  // Update a user (admin only)
  app.put("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== "admin") return res.sendStatus(403);
    
    const userId = parseInt(req.params.id);
    
    try {
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      let userData = { ...req.body };
      
      // If password is being updated, hash it
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Remove password from response
      const userResponse = { ...updatedUser };
      delete userResponse.password;
      
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar usuario" });
    }
  });
}
