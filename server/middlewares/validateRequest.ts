import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateRequest = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      next(error);
    }
  };
};
