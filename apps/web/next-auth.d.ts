import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string | number;
    role: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
  }
  interface Session {
    user: {
      id: string | number;
      role: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string | number;
    role?: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
  }
}
