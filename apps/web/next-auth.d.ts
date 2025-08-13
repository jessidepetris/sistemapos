import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string | number;
    role: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
    canViewSalesSummary?: boolean;
  }
  interface Session {
    user: {
      id: string | number;
      role: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
      canViewSalesSummary?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string | number;
    role?: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
    canViewSalesSummary?: boolean;
  }
}
