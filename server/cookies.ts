// Utilidad para manejar cookies de manera consistente

import { CookieOptions, Response } from 'express';

export const CART_SESSION_COOKIE = 'cart_session_id';

// Configuración de cookies estandarizada para el carrito
export function setCartSessionCookie(res: Response, sessionId: string): void {
  const cookieOptions: CookieOptions = {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    httpOnly: true,
    sameSite: 'lax', // Balance entre seguridad y funcionalidad
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  };
  
  res.cookie(CART_SESSION_COOKIE, sessionId, cookieOptions);
}
