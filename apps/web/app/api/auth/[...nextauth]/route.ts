import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.username === 'admin' && credentials.password === 'admin') {
          return { id: '1', name: 'Admin', role: 'ADMIN' } as any;
        }
        if (credentials?.username === 'seller' && credentials.password === 'seller') {
          return { id: '2', name: 'Seller', role: 'VENDEDOR', canViewSalesSummary: false } as any;
        }
        if (credentials?.username && credentials.password) {
          const client = await prisma.client.findUnique({
            where: { email: credentials.username },
          });
          const hash = createHash('sha256')
            .update(credentials.password)
            .digest('hex');
          if (client && client.password === hash) {
            return { id: client.id, name: client.name, role: 'CLIENTE' } as any;
          }
        }
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.canViewSalesSummary = (user as any).canViewSalesSummary;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as any;
        (session.user as any).id = token.id as any;
        (session.user as any).canViewSalesSummary = (token as any).canViewSalesSummary;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/audit-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: (user as any).id,
            userEmail: (user as any).email || '',
            actionType: 'LOGIN',
            entity: 'Auth',
            details: `Usuario ${(user as any).id} inició sesión`,
          }),
        });
      } catch (err) {
        console.error('audit log error', err);
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
