'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50" dir={router.locale === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={router.locale === 'ar' ? 'rtl' : 'ltr'}>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
