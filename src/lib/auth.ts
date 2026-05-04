import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

async function logSession(userId: string | null, email: string | null, action: string, success: boolean, details?: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headersList.get('x-real-ip')
      || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await prisma.sessionLog.create({
      data: { userId, email, action, ip, userAgent, success, details },
    });
  } catch (e) {
    console.error('SessionLog error:', e);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',       type: 'email'    },
        password: { label: 'Contraseña',  type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          await logSession(null, credentials?.email || null, 'FAILED_LOGIN', false, 'Usuario no encontrado');
          return null;
        }

        const passwordOk = await compare(credentials.password, user.password);
        if (!passwordOk) {
          await logSession(user.id, user.email, 'FAILED_LOGIN', false, 'Contraseña incorrecta');
          return null;
        }

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, credentials }) {
      if (user?.id) {
        await logSession(user.id, credentials?.email as string || user.email || '', 'LOGIN', true);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; role: string }).id   = token.id as string;
        (session.user as { id: string; role: string }).role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      try {
        await prisma.sessionLog.create({
          data: {
            userId: (token.id as string) || null,
            email: (token.email as string) || null,
            action: 'LOGOUT',
            ip: 'unknown',
            userAgent: 'unknown',
            success: true,
          },
        });
      } catch (e) {
        console.error('SessionLog signOut error:', e);
      }
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
