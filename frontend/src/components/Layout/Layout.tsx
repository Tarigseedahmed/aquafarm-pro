'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import SmartAlertBanner from '@/components/shared/SmartAlertBanner';
// import LoadingOptimizer from '@/components/performance/LoadingOptimizer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [locale, setLocale] = useState('ar');

  const isLoginPage = router.pathname === '/login';

  useEffect(() => {
    // Get saved preferences
    const savedLocale = localStorage.getItem('locale') || 'ar';
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    setLocale(savedLocale);
    setIsDarkMode(savedDarkMode);
    setIsSidebarCollapsed(savedSidebarCollapsed);

    // Apply dark mode
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleSidebar = () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', newCollapsed.toString());
  };

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Smart Alert Banner */}
      <SmartAlertBanner />

      {/* Header */}
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <motion.main
          className="flex-1 transition-all duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={router.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>© 2024 AquaFarm Pro. جميع الحقوق محفوظة.</p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
              <span>الإصدار 1.0.0</span>
              <span>•</span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                جميع الأنظمة تعمل بشكل طبيعي
              </span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
