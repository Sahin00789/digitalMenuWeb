'use client';

import { SuperadminAuthProvider } from '@/context/SuperadminAuthContext';

export default function SuperadminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperadminAuthProvider>
      {children}
    </SuperadminAuthProvider>
  );
}
