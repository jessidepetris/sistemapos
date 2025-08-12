import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware() {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith('/products/new')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname.startsWith('/pos')) {
          return token?.role === 'ADMIN' || token?.role === 'VENDEDOR';
        }
        if (req.nextUrl.pathname.startsWith('/accounts')) {
          return token?.role === 'ADMIN' || token?.role === 'VENDEDOR';
        }
        if (req.nextUrl.pathname.startsWith('/quotations')) {
          return token?.role === 'ADMIN' || token?.role === 'VENDEDOR';
        }
        if (req.nextUrl.pathname.startsWith('/orders')) {
          return token?.role === 'ADMIN' || token?.role === 'VENDEDOR';
        }
        if (req.nextUrl.pathname.startsWith('/deliveries')) {
          return token?.role === 'ADMIN' || token?.role === 'VENDEDOR';
        }
        if (req.nextUrl.pathname.startsWith('/informes')) {
          return token?.role === 'ADMIN';
        }
        if (
          req.nextUrl.pathname.startsWith('/mi-catalogo') ||
          req.nextUrl.pathname.startsWith('/mi-carrito') ||
          req.nextUrl.pathname.startsWith('/mis-pedidos')
        ) {
          return token?.role === 'CLIENTE';
        }
        if (
          req.nextUrl.pathname.startsWith('/products/actualizacion-masiva') ||
          req.nextUrl.pathname.startsWith('/products/seguimiento-precios')
        ) {
          return token?.role === 'ADMIN';
        }
        if (
          req.nextUrl.pathname.startsWith('/suppliers') ||
          req.nextUrl.pathname.startsWith('/purchases')
        ) {
          return token?.role === 'ADMIN' || token?.role === 'VENDEDOR';
        }
        if (req.nextUrl.pathname.startsWith('/promotions')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname.startsWith('/etiquetas')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname.startsWith('/configuracion/backups')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname.startsWith('/audit-logs')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname === '/') {
          return token?.role === 'ADMIN' || token?.role === 'VENDEDOR';
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/products/new',
    '/pos',
    '/accounts/:path*',
    '/quotations/:path*',
    '/orders/:path*',
    '/deliveries/:path*',
    '/informes/:path*',
    '/mi-catalogo',
    '/mi-carrito',
    '/mis-pedidos',
    '/suppliers/:path*',
    '/purchases/:path*',
    '/products/actualizacion-masiva',
    '/products/seguimiento-precios',
    '/audit-logs',
    '/configuracion/backups',
    '/promotions',
    '/etiquetas',
    '/',
  ],
};
