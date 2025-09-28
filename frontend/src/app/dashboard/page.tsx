'use client';

import { useDashboardStats, useRecentActivity, useWeather, useAlerts } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, isUserLoading } = useAuth();
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();
  const { data: weather, isLoading: weatherLoading } = useWeather();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();

  useEffect(() => {
    if (!isUserLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isUserLoading, router]);

  if (isUserLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي الأحواض',
      value: stats?.totalPonds || 0,
      icon: '🐟',
      color: 'bg-blue-500',
    },
    {
      title: 'الدورات النشطة',
      value: stats?.activeCycles || 0,
      icon: '🌱',
      color: 'bg-green-500',
    },
    {
      title: 'إجمالي الأسماك',
      value: (stats?.totalFish || 0).toLocaleString(),
      icon: '📊',
      color: 'bg-purple-500',
    },
    {
      title: 'جودة المياه',
      value: `${stats?.waterQuality || 0}%`,
      icon: '💧',
      color: 'bg-aqua-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="mt-2 text-gray-600">نظرة عامة على أداء مزرعتك</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="mr-4 rtl:mr-0 rtl:ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">النشاط الأخير</h2>
        </div>
        <div className="p-6">
          {activityLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-aqua-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">جاري تحميل النشاط...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity?.map((activity, index) => (
                <div key={activity.id || index} className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
          <div className="space-y-3">
            <button className="w-full text-right px-4 py-2 bg-aqua-50 text-aqua-700 rounded-lg hover:bg-aqua-100 transition-colors">
              إضافة حوض جديد
            </button>
            <button className="w-full text-right px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              تسجيل قياسات
            </button>
            <button className="w-full text-right px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              إنشاء تقرير
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">التنبيهات</h3>
          {alertsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-aqua-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">جاري تحميل التنبيهات...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts?.map((alert, index) => (
                <div key={alert.id || index} className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-400' :
                    alert.severity === 'high' ? 'bg-orange-400' :
                    alert.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`}></div>
                  <span className="text-sm text-gray-700">{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الطقس</h3>
          {weatherLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-aqua-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">جاري تحميل بيانات الطقس...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-2">{weather?.icon || '☀️'}</div>
              <p className="text-2xl font-bold text-gray-900">{weather?.temperature || 0}°C</p>
              <p className="text-sm text-gray-600">{weather?.condition || 'غير متوفر'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
