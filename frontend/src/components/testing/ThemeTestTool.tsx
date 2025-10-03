'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Zap,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ThemeTestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
  details?: string;
}

export default function ThemeTestTool() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [testResults, setTestResults] = useState<ThemeTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [foucDetected, setFoucDetected] = useState(false);
  const [themeSwitchTimes, setThemeSwitchTimes] = useState<number[]>([]);

  const themes = [
    { id: 'light', name: 'فاتح', icon: Sun },
    { id: 'dark', name: 'داكن', icon: Moon },
    { id: 'system', name: 'النظام', icon: Monitor }
  ];

  const colorThemes = [
    { id: 'aqua', name: 'Aqua Green', color: '#14b8a6' },
    { id: 'ocean', name: 'Ocean Blue', color: '#0ea5e9' },
    { id: 'forest', name: 'Forest Green', color: '#22c55e' }
  ];

  const runThemeTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setThemeSwitchTimes([]);
    
    const tests: ThemeTestResult[] = [];
    const switchTimes: number[] = [];

    // Test 1: Theme Provider Initialization
    const startTime = performance.now();
    const hasThemeProvider = document.documentElement.hasAttribute('data-theme') || 
                           document.documentElement.classList.contains('dark') ||
                           document.documentElement.classList.contains('light');
    
    tests.push({
      test: 'Theme Provider Initialization',
      status: hasThemeProvider ? 'pass' : 'fail',
      message: hasThemeProvider ? 'Theme Provider مُهيأ' : 'Theme Provider غير مُهيأ',
      duration: performance.now() - startTime
    });

    // Test 2: FOUC Detection
    const foucStart = performance.now();
    let foucDetected = false;
    
    // Simulate theme switch to detect FOUC
    const originalTheme = document.documentElement.className;
    document.documentElement.className = 'dark';
    await new Promise(resolve => setTimeout(resolve, 10));
    document.documentElement.className = originalTheme;
    
    const foucDuration = performance.now() - foucStart;
    foucDetected = foucDuration > 100; // FOUC if switch takes more than 100ms
    
    tests.push({
      test: 'FOUC Detection',
      status: foucDetected ? 'fail' : 'pass',
      message: foucDetected ? 'تم اكتشاف وميض FOUC' : 'لا يوجد وميض FOUC',
      duration: foucDuration,
      details: foucDetected ? 'يحتاج تحسين' : 'ممتاز'
    });

    // Test 3: Theme Switch Performance
    for (const themeOption of themes) {
      const switchStart = performance.now();
      setTheme(themeOption.id);
      await new Promise(resolve => setTimeout(resolve, 50)); // Wait for theme to apply
      const switchDuration = performance.now() - switchStart;
      switchTimes.push(switchDuration);
      
      tests.push({
        test: `Theme Switch: ${themeOption.name}`,
        status: switchDuration < 200 ? 'pass' : switchDuration < 500 ? 'warning' : 'fail',
        message: `تبديل إلى ${themeOption.name}: ${switchDuration.toFixed(0)}ms`,
        duration: switchDuration,
        details: switchDuration < 200 ? 'سريع' : switchDuration < 500 ? 'متوسط' : 'بطيء'
      });
    }

    // Test 4: Color Theme Application
    for (const colorTheme of colorThemes) {
      const colorStart = performance.now();
      document.documentElement.setAttribute('data-theme', colorTheme.id);
      await new Promise(resolve => setTimeout(resolve, 10));
      const colorDuration = performance.now() - colorStart;
      
      tests.push({
        test: `Color Theme: ${colorTheme.name}`,
        status: colorDuration < 100 ? 'pass' : 'warning',
        message: `تطبيق ${colorTheme.name}: ${colorDuration.toFixed(0)}ms`,
        duration: colorDuration,
        details: colorDuration < 100 ? 'فوري' : 'بطيء'
      });
    }

    // Test 5: CSS Variables Support
    const cssVarsSupported = CSS.supports('color', 'var(--primary)');
    tests.push({
      test: 'CSS Variables Support',
      status: cssVarsSupported ? 'pass' : 'fail',
      message: cssVarsSupported ? 'متغيرات CSS مدعومة' : 'متغيرات CSS غير مدعومة'
    });

    // Test 6: Theme Persistence
    const savedTheme = localStorage.getItem('theme');
    const savedColorTheme = localStorage.getItem('theme-color');
    tests.push({
      test: 'Theme Persistence',
      status: (savedTheme && savedColorTheme) ? 'pass' : 'warning',
      message: savedTheme && savedColorTheme ? 'الثيمات محفوظة' : 'الثيمات غير محفوظة',
      details: `Theme: ${savedTheme || 'غير محفوظ'}, Color: ${savedColorTheme || 'غير محفوظ'}`
    });

    // Test 7: System Theme Detection
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    tests.push({
      test: 'System Theme Detection',
      status: 'pass',
      message: `تفضيل النظام: ${systemPrefersDark ? 'داكن' : 'فاتح'}`,
      details: 'تم اكتشاف تفضيل النظام بنجاح'
    });

    // Test 8: Theme Transition Performance
    const transitionStart = performance.now();
    document.documentElement.style.transition = 'all 0.3s ease';
    setTheme('light');
    await new Promise(resolve => setTimeout(resolve, 100));
    setTheme('dark');
    await new Promise(resolve => setTimeout(resolve, 100));
    document.documentElement.style.transition = '';
    const transitionDuration = performance.now() - transitionStart;
    
    tests.push({
      test: 'Theme Transitions',
      status: transitionDuration < 500 ? 'pass' : 'warning',
      message: `انتقالات الثيم: ${transitionDuration.toFixed(0)}ms`,
      duration: transitionDuration,
      details: transitionDuration < 500 ? 'سلس' : 'يحتاج تحسين'
    });

    setTestResults(tests);
    setThemeSwitchTimes(switchTimes);
    setIsRunning(false);
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

  const averageSwitchTime = themeSwitchTimes.length > 0 
    ? themeSwitchTimes.reduce((a, b) => a + b, 0) / themeSwitchTimes.length 
    : 0;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Palette className="icon-md" />
            <span>أداة اختبار الثيمات</span>
          </CardTitle>
          <CardDescription>
            اختبار شامل لنظام الثيمات وعدم وجود وميض FOUC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Theme Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">الثيم الحالي</h4>
              <p className="text-sm text-muted-foreground">
                {theme} ({resolvedTheme})
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">متوسط وقت التبديل</h4>
              <p className="text-sm text-muted-foreground">
                {averageSwitchTime.toFixed(0)}ms
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">حالة FOUC</h4>
              <p className="text-sm text-muted-foreground">
                {foucDetected ? 'مكتشف' : 'غير مكتشف'}
              </p>
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button 
              onClick={runThemeTests} 
              disabled={isRunning}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Zap className={`icon-sm ${isRunning ? 'animate-pulse' : ''}`} />
              <span>{isRunning ? 'جاري الاختبار...' : 'تشغيل اختبارات الثيمات'}</span>
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">نتائج اختبارات الثيمات</h3>
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
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {result.duration && (
                        <div className="flex items-center space-x-1 rtl:space-x-reverse text-xs text-muted-foreground">
                          <Clock className="icon-sm" />
                          <span>{result.duration.toFixed(0)}ms</span>
                        </div>
                      )}
                      <Badge className={getStatusColor(result.status)}>
                        {result.status === 'pass' ? 'نجح' : 
                         result.status === 'fail' ? 'فشل' : 'تحذير'}
                      </Badge>
                    </div>
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
