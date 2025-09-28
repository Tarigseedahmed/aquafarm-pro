'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

export default function Header() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLocale = router.locale === 'ar' ? 'en' : 'ar';
    router.push(router.pathname, router.asPath, { locale: newLocale });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-aqua-600">
                AquaFarm Pro
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8 rtl:space-x-reverse">
            <a
              href="/dashboard"
              className="text-gray-700 hover:text-aqua-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('navigation.dashboard')}
            </a>
            <a
              href="/ponds"
              className="text-gray-700 hover:text-aqua-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('navigation.ponds')}
            </a>
            <a
              href="/production"
              className="text-gray-700 hover:text-aqua-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('navigation.production')}
            </a>
            <a
              href="/accounting"
              className="text-gray-700 hover:text-aqua-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('navigation.accounting')}
            </a>
            <a
              href="/reports"
              className="text-gray-700 hover:text-aqua-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('navigation.reports')}
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium text-gray-700"
            >
              {router.locale === 'ar' ? 'English' : 'العربية'}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aqua-500"
              >
                <div className="h-8 w-8 rounded-full bg-aqua-500 flex items-center justify-center">
                  <span className="text-white font-medium">U</span>
                </div>
              </button>

              {isMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <a
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('navigation.settings')}
                    </a>
                    <a
                      href="/logout"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('auth.logout')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
