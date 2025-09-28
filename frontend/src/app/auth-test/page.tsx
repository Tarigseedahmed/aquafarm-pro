'use client';

import { useState } from 'react';

const API_BASE_URL = 'http://localhost:3001';

interface AuthTestResult {
  endpoint: string;
  method: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
}

export default function AuthTestPage() {
  const [results, setResults] = useState<AuthTestResult[]>([]);
  const [registerData, setRegisterData] = useState({
    name: 'مستخدم تجريبي',
    email: 'test@example.com',
    password: '123456',
    role: 'user',
    company: 'مزرعة تجريبية',
    phone: '+966501234567'
  });
  const [loginData, setLoginData] = useState({
    email: 'test@example.com',
    password: '123456'
  });
  const [token, setToken] = useState<string>('');

  const updateResult = (endpoint: string, method: string, update: Partial<AuthTestResult>) => {
    setResults(prev => {
      const existing = prev.find(r => r.endpoint === endpoint && r.method === method);
      if (existing) {
        return prev.map(r => r.endpoint === endpoint && r.method === method 
          ? { ...r, ...update } : r);
      }
      return [...prev, { endpoint, method, ...update } as AuthTestResult];
    });
  };

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any, useAuth: boolean = false) => {
    updateResult(endpoint, method, { status: 'loading' });
    
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (useAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      
      if (response.ok) {
        updateResult(endpoint, method, { 
          status: 'success', 
          data 
        });
        
        // حفظ token من تسجيل الدخول أو التسجيل
        if ((endpoint === '/auth/login' || endpoint === '/auth/register') && data.access_token) {
          setToken(data.access_token);
        }
      } else {
        updateResult(endpoint, method, { 
          status: 'error', 
          error: data.message || `Error ${response.status}` 
        });
      }
    } catch (error) {
      updateResult(endpoint, method, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const clearResults = () => {
    setResults([]);
    setToken('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          اختبار نظام المصادقة - AquaFarm Pro
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* لوحة التحكم */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">اختبارات المصادقة</h2>
            
            <div className="space-y-4">
              {/* اختبار Auth Controller */}
              <button
                onClick={() => testEndpoint('/auth/test')}
                className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
              >
                اختبار Auth Controller
              </button>
              
              {/* تسجيل مستخدم جديد */}
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">تسجيل مستخدم جديد</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="الاسم"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    className="border p-2 rounded text-sm"
                    aria-label="الاسم"
                    title="أدخل الاسم"
                  />
                  <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="border p-2 rounded text-sm"
                    aria-label="البريد الإلكتروني"
                    title="أدخل البريد الإلكتروني"
                  />
                  <input
                    type="password"
                    placeholder="كلمة المرور"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="border p-2 rounded text-sm"
                    aria-label="كلمة المرور"
                    title="أدخل كلمة المرور"
                  />
                  <input
                    type="text"
                    placeholder="الشركة"
                    value={registerData.company}
                    onChange={(e) => setRegisterData({...registerData, company: e.target.value})}
                    className="border p-2 rounded text-sm"
                    aria-label="الشركة"
                    title="أدخل اسم الشركة"
                  />
                </div>
                <button
                  onClick={() => testEndpoint('/auth/register', 'POST', registerData)}
                  className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  تسجيل مستخدم
                </button>
              </div>
              
              {/* تسجيل دخول */}
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">تسجيل الدخول</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    className="border p-2 rounded text-sm"
                    aria-label="البريد الإلكتروني"
                    title="أدخل البريد الإلكتروني"
                  />
                  <input
                    type="password"
                    placeholder="كلمة المرور"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="border p-2 rounded text-sm"
                    aria-label="كلمة المرور"
                    title="أدخل كلمة المرور"
                  />
                </div>
                <button
                  onClick={() => testEndpoint('/auth/login', 'POST', loginData)}
                  className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  تسجيل الدخول
                </button>
              </div>
              
              {/* اختبارات محمية */}
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">الاختبارات المحمية</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Token: {token ? '✅ متوفر' : '❌ غير متوفر'}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => testEndpoint('/auth/profile', 'GET', null, true)}
                    className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
                    disabled={!token}
                  >
                    الحصول على البروفايل
                  </button>
                  <button
                    onClick={() => testEndpoint('/protected', 'GET', null, true)}
                    className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600"
                    disabled={!token}
                  >
                    اختبار Endpoint محمي
                  </button>
                  <button
                    onClick={() => testEndpoint('/users', 'GET', null, true)}
                    className="w-full bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600"
                    disabled={!token}
                  >
                    قائمة المستخدمين
                  </button>
                </div>
              </div>
              
              {/* إعدادات */}
              <div className="flex gap-2">
                <button
                  onClick={clearResults}
                  className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                >
                  مسح النتائج
                </button>
                <button
                  onClick={() => testEndpoint('/users/test/mock')}
                  className="flex-1 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                >
                  بيانات تجريبية
                </button>
              </div>
            </div>
          </div>
          
          {/* النتائج */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">النتائج</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-center">لا توجد نتائج بعد</p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{result.method} {result.endpoint}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${
                        result.status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                        result.status === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'loading' ? 'جاري التحميل...' :
                         result.status === 'success' ? 'نجح' : 'فشل'}
                      </span>
                    </div>
                    
                    {result.status === 'success' && result.data && (
                      <div className="bg-green-50 p-3 rounded text-sm">
                        <pre className="whitespace-pre-wrap text-right">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {result.status === 'error' && result.error && (
                      <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}