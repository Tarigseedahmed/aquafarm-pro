'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewWaterQualityPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    pondId: '',
    temperature: '',
    ph: '',
    dissolvedOxygen: '',
    ammonia: '',
    nitrite: '',
    nitrate: '',
    salinity: '',
    turbidity: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.pondId) {
      newErrors.pondId = 'يجب اختيار الحوض';
    }
    
    // Validate required parameters
    const required = ['temperature', 'ph', 'dissolvedOxygen', 'ammonia'];
    required.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'هذا الحقل مطلوب';
      }
    });
    
    // Validate ranges
    if (formData.temperature) {
      const temp = parseFloat(formData.temperature);
      if (temp < 0 || temp > 50) {
        newErrors.temperature = 'القيمة يجب أن تكون بين 0 و 50';
      }
    }
    
    if (formData.ph) {
      const ph = parseFloat(formData.ph);
      if (ph < 0 || ph > 14) {
        newErrors.ph = 'القيمة يجب أن تكون بين 0 و 14';
      }
    }
    
    if (formData.dissolvedOxygen) {
      const oxygen = parseFloat(formData.dissolvedOxygen);
      if (oxygen < 0 || oxygen > 20) {
        newErrors.dissolvedOxygen = 'القيمة يجب أن تكون بين 0 و 20';
      }
    }
    
    if (formData.ammonia) {
      const ammonia = parseFloat(formData.ammonia);
      if (ammonia < 0 || ammonia > 5) {
        newErrors.ammonia = 'القيمة يجب أن تكون بين 0 و 5';
      }
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
      // TODO: Call API to create reading
      // await waterQualityService.createReading(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to list
      router.push('/water-quality');
    } catch (error: any) {
      setErrors({
        general: error.message || 'فشل حفظ القراءة. يرجى المحاولة مرة أخرى.',
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
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link href="/water-quality" className="ml-4 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">إضافة قراءة جودة المياه</h1>
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
          {/* Pond Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحوض <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.pondId}
              onChange={(e) => handleChange('pondId', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.pondId ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">اختر الحوض</option>
              <option value="pond-1">حوض رقم 1</option>
              <option value="pond-2">حوض رقم 2</option>
            </select>
            {errors.pondId && <p className="mt-1 text-sm text-red-600">{errors.pondId}</p>}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">القراءات الأساسية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  درجة الحرارة (°C) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleChange('temperature', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.temperature ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="25.5"
                  disabled={isLoading}
                />
                {errors.temperature && <p className="mt-1 text-sm text-red-600">{errors.temperature}</p>}
                <p className="mt-1 text-xs text-gray-500">النطاق الأمثل: 24-28°C</p>
              </div>

              {/* pH */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  pH <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ph}
                  onChange={(e) => handleChange('ph', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.ph ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="7.5"
                  disabled={isLoading}
                />
                {errors.ph && <p className="mt-1 text-sm text-red-600">{errors.ph}</p>}
                <p className="mt-1 text-xs text-gray-500">النطاق الأمثل: 7.0-8.5</p>
              </div>

              {/* Dissolved Oxygen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأكسجين المذاب (mg/L) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.dissolvedOxygen}
                  onChange={(e) => handleChange('dissolvedOxygen', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.dissolvedOxygen ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="8.5"
                  disabled={isLoading}
                />
                {errors.dissolvedOxygen && <p className="mt-1 text-sm text-red-600">{errors.dissolvedOxygen}</p>}
                <p className="mt-1 text-xs text-gray-500">النطاق الأمثل: 6.0-10.0 mg/L</p>
              </div>

              {/* Ammonia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأمونيا (mg/L) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ammonia}
                  onChange={(e) => handleChange('ammonia', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.ammonia ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0.15"
                  disabled={isLoading}
                />
                {errors.ammonia && <p className="mt-1 text-sm text-red-600">{errors.ammonia}</p>}
                <p className="mt-1 text-xs text-gray-500">النطاق الأمثل: 0-0.25 mg/L</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">قراءات إضافية (اختياري)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nitrite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  النتريت (mg/L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.nitrite}
                  onChange={(e) => handleChange('nitrite', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.05"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">النطاق الأمثل: 0-0.1 mg/L</p>
              </div>

              {/* Nitrate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  النترات (mg/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.nitrate}
                  onChange={(e) => handleChange('nitrate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10.0"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">النطاق الأمثل: 0-20 mg/L</p>
              </div>

              {/* Salinity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الملوحة (ppt)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.salinity}
                  onChange={(e) => handleChange('salinity', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="15.0"
                  disabled={isLoading}
                />
              </div>

              {/* Turbidity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العكارة (NTU)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.turbidity}
                  onChange={(e) => handleChange('turbidity', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="5.0"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="أي ملاحظات أو تعليقات..."
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
              {isLoading ? 'جاري الحفظ...' : 'حفظ القراءة'}
            </button>
            <Link
              href="/water-quality"
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

