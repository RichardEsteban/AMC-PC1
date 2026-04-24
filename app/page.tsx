'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { Dashboard } from '@/components/dashboard';

export default function Home() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
