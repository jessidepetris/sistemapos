import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure the authenticated user has the required role.
 * @param requiredRole - The role that the user must have.
 */
export function authorizeRole(
  requiredRole: 'admin' | 'vendedor' | Array<'admin' | 'vendedor'>,
) {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    next();
  };
}
