'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const deviceBreakpoints = [
  { name: 'Mobile Small', width: 375, height: 667, icon: Smartphone },
  { name: 'Mobile Large', width: 414, height: 896, icon: Smartphone },
  { name: 'Tablet Portrait', width: 768, height: 1024, icon: Tablet },
  { name: 'Tablet Landscape', width: 1024, height: 768, icon: Tablet },
  { name: 'Desktop Small', width: 1280, height: 720, icon: Monitor },
  { name: 'Desktop Large', width: 1920, height: 1080, icon: Monitor }
];

export default function ResponsiveTestTool() {
  const [currentDevice, setCurrentDevice] = useState(deviceBreakpoints[0]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests: TestResult[] = [];
    
    // Test 1: Viewport Meta Tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    tests.push({
      test: 'Viewport Meta Tag',
      status: viewportMeta ? 'pass' : 'fail',
      message: viewportMeta ? 'Viewport meta tag موجود' : 'Viewport meta tag مفقود',
      details: (viewportMeta?.getAttribute('content') ?? undefined)
    });

    // Test 2: CSS Grid Support
    const gridSupport = CSS.supports('display', 'grid');
    tests.push({
      test: 'CSS Grid Support',
      status: gridSupport ? 'pass' : 'fail',
      message: gridSupport ? 'CSS Grid مدعوم' : 'CSS Grid غير مدعوم'
    });

    // Test 3: Flexbox Support
    const flexboxSupport = CSS.supports('display', 'flex');
    tests.push({
      test: 'Flexbox Support',
      status: flexboxSupport ? 'pass' : 'fail',
      message: flexboxSupport ? 'Flexbox مدعوم' : 'Flexbox غير مدعوم'
    });

    // Test 4: Touch Support
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    tests.push({
      test: 'Touch Support',
      status: touchSupport ? 'pass' : 'warning',
      message: touchSupport ? 'دعم اللمس متاح' : 'دعم اللمس غير متاح'
    });

    // Test 5: Dark Mode Support
    const darkModeSupport = window.matchMedia('(prefers-color-scheme: dark)').matches;
    tests.push({
      test: 'Dark Mode Detection',
      status: 'pass',
      message: `وضع النظام: ${darkModeSupport ? 'داكن' : 'فاتح'}`
    });

    // Test 6: RTL Support
    const rtlSupport = document.documentElement.dir === 'rtl';
    tests.push({
      test: 'RTL Support',
      status: rtlSupport ? 'pass' : 'fail',
      message: rtlSupport ? 'دعم RTL مفعل' : 'دعم RTL غير مفعل'
    });

    // Test 7: Font Loading
    const cairoFont = document.fonts.check('16px Cairo');
    tests.push({
      test: 'Font Loading',
      status: cairoFont ? 'pass' : 'fail',
      message: cairoFont ? 'خط Cairo محمل' : 'خط Cairo غير محمل'
    });

    // Test 8: Performance
    const performance = window.performance;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
    
    tests.push({
      test: 'Page Load Time',
      status: loadTime < 3000 ? 'pass' : loadTime < 5000 ? 'warning' : 'fail',
      message: `وقت التحميل: ${loadTime.toFixed(0)}ms`,
      details: loadTime < 3000 ? 'سريع جداً' : loadTime < 5000 ? 'سريع' : 'بطيء'
    });

    // Test 9: Memory Usage
    const memory = (performance as any).memory;
    if (memory) {
      const usedMemory = memory.usedJSHeapSize / 1024 / 1024;
      tests.push({
        test: 'Memory Usage',
        status: usedMemory < 50 ? 'pass' : usedMemory < 100 ? 'warning' : 'fail',
        message: `استخدام الذاكرة: ${usedMemory.toFixed(1)}MB`,
        details: usedMemory < 50 ? 'ممتاز' : usedMemory < 100 ? 'جيد' : 'يحتاج تحسين'
      });
    }

    // Test 10: Responsive Elements
    const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="xl:"]');
    tests.push({
      test: 'Responsive Classes',
      status: responsiveElements.length > 0 ? 'pass' : 'fail',
      message: `العناصر المتجاوبة: ${responsiveElements.length}`,
      details: responsiveElements.length > 0 ? 'موجود' : 'غير موجود'
    });

    setTestResults(tests);
    setIsRunning(false);
  };

  const simulateDevice = (device: typeof deviceBreakpoints[0]) => {
    setCurrentDevice(device);
    
    // Update viewport simulation
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', `width=${device.width}, initial-scale=1`);
    }
    
    // Update body classes for testing
    document.body.className = document.body.className
      .replace(/device-\w+/g, '')
      .trim() + ` device-${device.name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const exportResults = () => {
    const report = {
      timestamp: new Date().toISOString(),
      device: currentDevice,
      results: testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'pass').length,
        failed: testResults.filter(r => r.status === 'fail').length,
        warnings: testResults.filter(r => r.status === 'warning').length
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responsive-test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="icon-sm text-green-600" />;
      case 'fail': return <XCircle className="icon-sm text-red-600" />;
      case 'warning': return <AlertTriangle className="icon-sm text-orange-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Monitor className="icon-md" />
            <span>أداة اختبار الاستجابة</span>
          </CardTitle>
          <CardDescription>
            اختبار شامل للتطبيق على أحجام شاشات مختلفة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Device Simulation */}
          <div>
            <h3 className="text-lg font-semibold mb-3">محاكاة الأجهزة</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {deviceBreakpoints.map((device) => {
                const Icon = device.icon;
                return (
                  <Button
                    key={device.name}
                    variant={currentDevice.name === device.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => simulateDevice(device)}
                    className="flex flex-col items-center space-y-1 h-auto py-3"
                  >
                    <Icon className="icon-sm" />
                    <span className="text-xs">{device.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {device.width}×{device.height}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <RefreshCw className={`icon-sm ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'جاري الاختبار...' : 'تشغيل الاختبارات'}</span>
            </Button>
            
            {testResults.length > 0 && (
              <Button variant="outline" onClick={exportResults}>
                <Download className="icon-sm mr-2" />
                تصدير النتائج
              </Button>
            )}
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">نتائج الاختبارات</h3>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {getStatusIcon(result.status)}
                      <div>
                        <h4 className="font-medium">{result.test}</h4>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                        {result.details && (
                          <p className="text-xs text-muted-foreground">{result.details}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status === 'pass' ? 'نجح' : 
                       result.status === 'fail' ? 'فشل' : 'تحذير'}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
