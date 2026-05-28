import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import PortalLayoutClient from './PortalLayoutClient';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  const token = await getToken({
    req: { cookies: cookieStore } as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET!,
  });

  let role = (token?.role as string) ?? '';

  // Si el JWT no tiene role (sesión antigua), buscarlo en la DB
  if (!role && token?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email as string },
        select: { role: true },
      });
      role = (dbUser?.role as string) ?? '';
    } catch { /* continuar sin role */ }
  }

  const isSuperAdmin = role === 'SUPERADMIN';

  return (
    <PortalLayoutClient isSuperAdmin={isSuperAdmin}>
      {children}
    </PortalLayoutClient>
  );
}
