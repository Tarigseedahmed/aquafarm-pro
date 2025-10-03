'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FishBatch {
  id: string;
  pondId: string;
  pondName?: string;
  species: string;
  initialCount: number;
  currentCount: number;
  averageWeight: number;
  stockingDate: string;
  expectedHarvestDate?: string;
  status: 'active' | 'harvested' | 'transferred';
  survivalRate?: number;
  feedConversionRatio?: number;
  healthStatus?: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function FishBatchesPage() {
  const [batches, setBatches] = useState<FishBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    pondId: 'all',
    status: 'all',
    species: 'all',
  });

  useEffect(() => {
    loadBatches();
  }, [filters]);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      // TODO: Call API
      // const data = await fishBatchesService.getBatches(filters);
      
      // Mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setBatches([
        {
          id: '1',
          pondId: 'pond-1',
          pondName: 'حوض رقم 1',
          species: 'بلطي نيلي',
          initialCount: 5000,
          currentCount: 4750,
          averageWeight: 250,
          stockingDate: '2025-08-01',
          expectedHarvestDate: '2025-12-01',
          status: 'active',
          survivalRate: 95,
          feedConversionRatio: 1.5,
          healthStatus: 'excellent',
        },
      ]);
    } catch (error) {
      console.error('Failed to load batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      harvested: 'bg-blue-100 text-blue-800',
      transferred: 'bg-yellow-100 text-yellow-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'نشط',
      harvested: 'تم الحصاد',
      transferred: 'محوّل',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getHealthBadge = (health?: string) => {
    if (!health) return 'bg-gray-100 text-gray-800';
    
    const badges = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
    };
    return badges[health as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getHealthLabel = (health?: string) => {
    const labels = {
      excellent: 'ممتاز',
      good: 'جيد',
      fair: 'مقبول',
      poor: 'ضعيف',
    };
    return health ? labels[health as keyof typeof labels] || health : '-';
  };

  const calculateAge = (stockingDate: string) => {
    const stocking = new Date(stockingDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - stocking.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} يوم`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} شهر`;
    return `${Math.floor(diffDays / 365)} سنة`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">إدارة دفعات الأسماك</h1>
            <Link
              href="/fish-batches/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة دفعة جديدة
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الفلترة والبحث</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحوض</label>
              <select
                value={filters.pondId}
                onChange={(e) => setFilters(prev => ({ ...prev, pondId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأحواض</option>
                <option value="pond-1">حوض رقم 1</option>
                <option value="pond-2">حوض رقم 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="harvested">تم الحصاد</option>
                <option value="transferred">محوّل</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
              <select
                value={filters.species}
                onChange={(e) => setFilters(prev => ({ ...prev, species: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="tilapia">بلطي</option>
                <option value="seabass">قاروص</option>
                <option value="seabream">دنيس</option>
              </select>
            </div>
          </div>
        </div>

        {/* Batches List */}
        {isLoading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-4 text-gray-600">جاري تحميل الدفعات...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-600 mb-4">لا توجد دفعات أسماك بعد</p>
            <Link
              href="/fish-batches/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              إضافة أول دفعة
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {batches.map((batch) => (
              <div key={batch.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{batch.species}</h3>
                      <p className="text-blue-100 text-sm mt-1">{batch.pondName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(batch.status)}`}>
                        {getStatusLabel(batch.status)}
                      </span>
                      {batch.healthStatus && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getHealthBadge(batch.healthStatus)}`}>
                          {getHealthLabel(batch.healthStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">العدد الحالي</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {batch.currentCount.toLocaleString('ar-SA')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        من {batch.initialCount.toLocaleString('ar-SA')}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">متوسط الوزن</p>
                      <p className="text-2xl font-bold text-gray-900">{batch.averageWeight}</p>
                      <p className="text-xs text-gray-500 mt-1">جرام</p>
                    </div>

                    {batch.survivalRate !== undefined && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">معدل البقاء</p>
                        <p className="text-2xl font-bold text-green-600">{batch.survivalRate}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${batch.survivalRate}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {batch.feedConversionRatio !== undefined && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">معامل التحويل الغذائي</p>
                        <p className="text-2xl font-bold text-blue-600">{batch.feedConversionRatio}</p>
                        <p className="text-xs text-gray-500 mt-1">FCR</p>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">تاريخ الزراعة:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(batch.stockingDate).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">العمر:</span>
                      <span className="font-medium text-gray-900">
                        {calculateAge(batch.stockingDate)}
                      </span>
                    </div>
                    {batch.expectedHarvestDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">الحصاد المتوقع:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(batch.expectedHarvestDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-2">
                    <Link
                      href={`/fish-batches/${batch.id}`}
                      className="flex-1 text-center bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      عرض التفاصيل
                    </Link>
                    <Link
                      href={`/fish-batches/${batch.id}/update`}
                      className="flex-1 text-center bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      تحديث القياسات
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Cards */}
        {!isLoading && batches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الدفعات</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{batches.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الأسماك</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {batches.reduce((sum, b) => sum + b.currentCount, 0).toLocaleString('ar-SA')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">متوسط البقاء</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {batches.length > 0
                      ? Math.round(batches.reduce((sum, b) => sum + (b.survivalRate || 0), 0) / batches.length)
                      : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">متوسط FCR</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {batches.length > 0
                      ? (batches.reduce((sum, b) => sum + (b.feedConversionRatio || 0), 0) / batches.length).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

