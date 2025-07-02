import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure the authenticated user has the required role.
 * @param requiredRole - The role that the user must have.
 */
export function authorizeRole(requiredRole: 'admin' | 'vendedor') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

    if (!user || user.role !== requiredRole) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    next();
  };
}
