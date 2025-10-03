'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Optimized loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">جاري التحميل...</p>
      </div>
    </div>
  );
}

// Optimized dashboard content
function DashboardContent() {
  const { user, isAuthenticated, isUserLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isUserLoading, router]);

  if (isUserLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            مرحباً، {user?.name}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            تم تسجيل الدخول بنجاح إلى AquaFarm Pro
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              معلومات الحساب
            </h2>
            <div className="space-y-3 text-left">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">الاسم:</span>
                <span className="mr-2 text-gray-900 dark:text-white">{user?.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني:</span>
                <span className="mr-2 text-gray-900 dark:text-white">{user?.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">معرف المستأجر:</span>
                <span className="mr-2 text-gray-900 dark:text-white">{user?.tenant_id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">اللغة:</span>
                <span className="mr-2 text-gray-900 dark:text-white">{user?.locale}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-500">
            تم تحسين الأداء - التحميل سريع الآن! ⚡
          </div>
        </div>
      </div>
    </div>
  );
}

// Main dashboard component with Suspense
export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  );
}