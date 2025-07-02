import { NextFunction, Request, Response } from "express";
import { logger } from "./logger";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(message, err);
  res.status(status).json({ message });
}
