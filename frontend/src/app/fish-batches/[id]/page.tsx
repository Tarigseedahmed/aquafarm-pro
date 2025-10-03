'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface FishBatch {
  id: string;
  pondId: string;
  pondName: string;
  species: string;
  initialCount: number;
  currentCount: number;
  averageWeight: number;
  stockingDate: string;
  expectedHarvestDate?: string;
  status: 'active' | 'harvested' | 'transferred';
  survivalRate: number;
  feedConversionRatio: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  totalFeedGiven?: number;
  totalBiomass?: number;
  notes?: string;
}

interface GrowthRecord {
  id: string;
  date: string;
  count: number;
  averageWeight: number;
  mortality: number;
  notes?: string;
}

export default function FishBatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  
  const [batch, setBatch] = useState<FishBatch | null>(null);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'feeding' | 'health'>('overview');

  useEffect(() => {
    loadBatchDetails();
  }, [batchId]);

  const loadBatchDetails = async () => {
    setIsLoading(true);
    try {
      // TODO: Call API
      // const data = await fishBatchesService.getBatch(batchId);
      
      // Mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setBatch({
        id: batchId,
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
        totalFeedGiven: 1200,
        totalBiomass: 1187.5,
        notes: 'دفعة ممتازة، نمو جيد حتى الآن',
      });
      
      setGrowthRecords([
        { id: '1', date: '2025-09-01', count: 4900, averageWeight: 150, mortality: 100, notes: 'نمو طبيعي' },
        { id: '2', date: '2025-09-15', count: 4850, averageWeight: 200, mortality: 50, notes: 'استمرار النمو' },
        { id: '3', date: '2025-10-01', count: 4750, averageWeight: 250, mortality: 100, notes: 'حالة ممتازة' },
      ]);
    } catch (error) {
      console.error('Failed to load batch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (stockingDate: string) => {
    const stocking = new Date(stockingDate);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - stocking.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateGrowthRate = () => {
    if (!batch) return 0;
    const days = calculateAge(batch.stockingDate);
    if (days === 0) return 0;
    const weightGain = batch.averageWeight - (growthRecords[0]?.averageWeight || 0);
    return (weightGain / days).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">جاري تحميل التفاصيل...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">لم يتم العثور على الدفعة</p>
          <Link href="/fish-batches" className="text-blue-600 hover:text-blue-700">
            العودة للقائمة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/fish-batches" className="ml-4 text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{batch.species}</h1>
                <p className="text-sm text-gray-600">{batch.pondName}</p>
              </div>
            </div>
            <Link
              href={`/fish-batches/${batch.id}/update`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              تحديث القياسات
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">العدد الحالي</p>
            <p className="text-3xl font-bold text-gray-900">{batch.currentCount.toLocaleString('ar-SA')}</p>
            <p className="text-sm text-gray-500 mt-1">من {batch.initialCount.toLocaleString('ar-SA')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">متوسط الوزن</p>
            <p className="text-3xl font-bold text-blue-600">{batch.averageWeight}</p>
            <p className="text-sm text-gray-500 mt-1">جرام</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">معدل البقاء</p>
            <p className="text-3xl font-bold text-green-600">{batch.survivalRate}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${batch.survivalRate}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">FCR</p>
            <p className="text-3xl font-bold text-purple-600">{batch.feedConversionRatio}</p>
            <p className="text-sm text-gray-500 mt-1">معامل التحويل</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b">
            <div className="flex">
              {[
                { key: 'overview', label: 'نظرة عامة', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { key: 'growth', label: 'سجل النمو', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                { key: 'feeding', label: 'التغذية', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
                { key: 'health', label: 'الصحة', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    {tab.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">تاريخ الزراعة</p>
                    <p className="text-lg font-semibold">{new Date(batch.stockingDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">العمر</p>
                    <p className="text-lg font-semibold">{calculateAge(batch.stockingDate)} يوم</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">الكتلة الحيوية</p>
                    <p className="text-lg font-semibold">{batch.totalBiomass?.toFixed(2)} كجم</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">معدل النمو اليومي</p>
                    <p className="text-lg font-semibold">{calculateGrowthRate()} جم/يوم</p>
                  </div>
                </div>
                
                {batch.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">ملاحظات:</p>
                    <p className="text-gray-600">{batch.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Growth Tab */}
            {activeTab === 'growth' && (
              <div className="space-y-4">
                {growthRecords.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900">
                        {new Date(record.date).toLocaleDateString('ar-SA')}
                      </p>
                      <span className="text-sm text-gray-500">{record.notes}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">العدد</p>
                        <p className="text-lg font-semibold">{record.count.toLocaleString('ar-SA')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">متوسط الوزن</p>
                        <p className="text-lg font-semibold">{record.averageWeight} جم</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">النفوق</p>
                        <p className="text-lg font-semibold text-red-600">{record.mortality}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Feeding Tab */}
            {activeTab === 'feeding' && (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">سجلات التغذية قريباً</p>
              </div>
            )}

            {/* Health Tab */}
            {activeTab === 'health' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium mb-1">الحالة الصحية</p>
                      <p className="text-2xl font-bold text-green-700">ممتازة</p>
                    </div>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">لا توجد مشاكل صحية مسجلة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

