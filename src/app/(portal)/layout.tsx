import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PortalLayoutClient from './PortalLayoutClient';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const isSuperAdmin = role === 'SUPERADMIN';

  return (
    <PortalLayoutClient isSuperAdmin={isSuperAdmin}>
      {children}
    </PortalLayoutClient>
  );
}
