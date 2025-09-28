'use client';

import React, { useState, useEffect } from 'react';

interface ApiTest {
  endpoint: string;
  name: string;
  status: 'pending' | 'success' | 'error';
  data?: unknown;
  error?: string;
}

export default function ApiTestPage() {
  const [tests, setTests] = useState<ApiTest[]>([
    { endpoint: '/api', name: 'Root endpoint', status: 'pending' },
    { endpoint: '/api/health', name: 'Health check', status: 'pending' },
    { endpoint: '/api/test', name: 'Test endpoint', status: 'pending' },
    { endpoint: '/api/farms', name: 'Farms data', status: 'pending' },
    { endpoint: '/api/ponds', name: 'Ponds data', status: 'pending' },
  ]);

  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const baseUrl = 'http://localhost:3001';

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      try {
        const response = await fetch(`${baseUrl}${test.endpoint}`);
        const data = await response.json();
        
        setTests(prev => prev.map((t, idx) => 
          idx === i ? {
            ...t,
            status: response.ok ? 'success' : 'error',
            data: data,
            error: response.ok ? undefined : `HTTP ${response.status}`
          } : t
        ));
      } catch (error: unknown) {
        setTests(prev => prev.map((t, idx) => 
          idx === i ? {
            ...t,
            status: 'error',
            error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
          } : t
        ));
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">اختبار API</h1>
        <p className="text-gray-600">اختبار اتصال Frontend مع Backend API</p>
      </div>

      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'جاري الاختبار...' : 'إعادة تشغيل الاختبارات'}
        </button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(test.status)}</span>
                <div>
                  <h3 className="font-medium">{test.name}</h3>
                  <p className="text-sm text-gray-600">{test.endpoint}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(test.status)}`}>
                {test.status === 'pending' ? 'انتظار' : test.status === 'success' ? 'نجح' : 'فشل'}
              </span>
            </div>

            {test.error && (
              <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                خطأ: {test.error}
              </div>
            )}

            {test.data && test.status === 'success' && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  عرض البيانات
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(test.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">معلومات الاختبار</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Backend URL: http://localhost:3001</li>
          <li>• Frontend URL: http://localhost:3000</li>
          <li>• API Prefix: /api</li>
        </ul>
      </div>
    </div>
  );
}