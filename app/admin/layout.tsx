import React from 'react';
import AppShell from '@/app/components/AppShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
