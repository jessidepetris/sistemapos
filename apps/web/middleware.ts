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
        if (req.nextUrl.pathname.startsWith('/dashboard-financiero')) {
          return (
            token?.role === 'ADMIN' ||
            (token?.role === 'VENDEDOR' && token?.canViewSalesSummary)
          );
        }
        if (
          req.nextUrl.pathname.startsWith('/mi-catalogo') ||
          req.nextUrl.pathname.startsWith('/mi-carrito') ||
          req.nextUrl.pathname.startsWith('/mis-pedidos')
        ) {
          return token?.role === 'CLIENTE';
        }
        if (req.nextUrl.pathname.startsWith('/pagos/conciliacion')) {
          return (
            token?.role === 'ADMIN' ||
            (token?.role === 'VENDEDOR' && token?.canViewSalesSummary)
          );
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
        if (req.nextUrl.pathname.startsWith('/cajas')) {
          return token?.role === 'ADMIN' || token?.role === 'VENDEDOR';
        }
        if (req.nextUrl.pathname.startsWith('/reabastecimiento')) {
          if (req.nextUrl.pathname.startsWith('/reabastecimiento/reglas')) {
            return token?.role === 'ADMIN';
          }
          return token?.role === 'ADMIN' || token?.role === 'VENDEDOR';
        }
        if (req.nextUrl.pathname.startsWith('/proveedores/lead-times')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname.startsWith('/importar-productos')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname.startsWith('/pack-variants')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname.startsWith('/balanza/generador')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname.startsWith('/barcodes')) {
          return token?.role === 'ADMIN';
        }
        if (req.nextUrl.pathname.startsWith('/inventarios')) {
          return token?.role === 'ADMIN' || token?.canAdjustStock;
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
        if (req.nextUrl.pathname.startsWith('/auditoria')) {
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
    '/dashboard-financiero',
    '/mi-catalogo',
    '/mi-carrito',
    '/mis-pedidos',
    '/suppliers/:path*',
    '/purchases/:path*',
    '/cajas/:path*',
    '/reabastecimiento/:path*',
    '/proveedores/lead-times',
    '/products/actualizacion-masiva',
    '/products/seguimiento-precios',
    '/auditoria',
    '/configuracion/backups',
    '/pagos/conciliacion',
      '/promotions',
      '/etiquetas',
      '/importar-productos/:path*',
      '/pack-variants',
    '/balanza/generador',
    '/barcodes/:path*',
    '/inventarios/:path*',
      '/',
    ],
  };
