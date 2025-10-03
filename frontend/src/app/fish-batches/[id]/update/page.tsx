'use client';

import { useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UpdateFishBatchPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  
  const [formData, setFormData] = useState({
    currentCount: '',
    averageWeight: '',
    mortality: '',
    healthStatus: 'excellent' as 'excellent' | 'good' | 'fair' | 'poor',
    notes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentCount) {
      newErrors.currentCount = 'العدد الحالي مطلوب';
    } else if (parseInt(formData.currentCount) < 0) {
      newErrors.currentCount = 'العدد يجب أن يكون صفر أو أكبر';
    }
    
    if (!formData.averageWeight) {
      newErrors.averageWeight = 'متوسط الوزن مطلوب';
    } else if (parseFloat(formData.averageWeight) <= 0) {
      newErrors.averageWeight = 'الوزن يجب أن يكون أكبر من صفر';
    }
    
    if (formData.mortality && parseInt(formData.mortality) < 0) {
      newErrors.mortality = 'عدد النفوق يجب أن يكون صفر أو أكبر';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call API
      // await fishBatchesService.updateBatch(batchId, formData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/fish-batches/${batchId}`);
    } catch (error: any) {
      setErrors({
        general: error.message || 'فشل تحديث القياسات. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link href={`/fish-batches/${batchId}`} className="ml-4 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">تحديث قياسات الدفعة</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 ml-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 ml-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">تحديث القياسات الدورية</p>
                <p>سجّل القياسات الجديدة. سيتم حساب معدلات البقاء والنمو والـ FCR تلقائياً.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العدد الحالي <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.currentCount}
                onChange={(e) => handleChange('currentCount', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.currentCount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="4750"
                disabled={isLoading}
              />
              {errors.currentCount && <p className="mt-1 text-sm text-red-600">{errors.currentCount}</p>}
              <p className="mt-1 text-xs text-gray-500">عدد الأسماك الحالي في الحوض</p>
            </div>

            {/* Average Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                متوسط الوزن (جرام) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.averageWeight}
                onChange={(e) => handleChange('averageWeight', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.averageWeight ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="250.5"
                disabled={isLoading}
              />
              {errors.averageWeight && <p className="mt-1 text-sm text-red-600">{errors.averageWeight}</p>}
              <p className="mt-1 text-xs text-gray-500">متوسط وزن السمكة الواحدة</p>
            </div>

            {/* Mortality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عدد النفوق (اختياري)
              </label>
              <input
                type="number"
                value={formData.mortality}
                onChange={(e) => handleChange('mortality', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.mortality ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0"
                disabled={isLoading}
              />
              {errors.mortality && <p className="mt-1 text-sm text-red-600">{errors.mortality}</p>}
              <p className="mt-1 text-xs text-gray-500">عدد الأسماك النافقة منذ آخر تحديث</p>
            </div>

            {/* Health Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة الصحية
              </label>
              <select
                value={formData.healthStatus}
                onChange={(e) => handleChange('healthStatus', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="excellent">ممتاز</option>
                <option value="good">جيد</option>
                <option value="fair">مقبول</option>
                <option value="poor">ضعيف</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="أي ملاحظات عن القياسات أو الحالة الصحية..."
              disabled={isLoading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ التحديثات'}
            </button>
            <Link
              href={`/fish-batches/${batchId}`}
              className="flex-1 text-center bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

