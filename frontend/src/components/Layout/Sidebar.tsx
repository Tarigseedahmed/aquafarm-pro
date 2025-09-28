'use client';

import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

export default function Sidebar() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const menuItems = [
    { href: '/dashboard', label: t('navigation.dashboard'), icon: '📊' },
    { href: '/ponds', label: t('navigation.ponds'), icon: '🐟' },
    { href: '/production', label: t('navigation.production'), icon: '🌱' },
    { href: '/accounting', label: t('navigation.accounting'), icon: '💰' },
    { href: '/reports', label: t('navigation.reports'), icon: '📈' },
    { href: '/settings', label: t('navigation.settings'), icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                router.pathname === item.href
                  ? 'bg-aqua-50 text-aqua-700 border-r-4 border-aqua-500'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-aqua-600'
              }`}
            >
              <span className="ml-3 rtl:ml-0 rtl:mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
