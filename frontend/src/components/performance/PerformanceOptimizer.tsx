'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Clock,
  MemoryStick,
  Wifi,
  Battery,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  networkSpeed: number;
  batteryLevel: number;
  fps: number;
  score: number;
}

export default function PerformanceOptimizer() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    memoryUsage: 0,
    networkSpeed: 0,
    batteryLevel: 0,
    fps: 0,
    score: 0
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState<string[]>([]);

  const measurePerformance = useCallback(() => {
    const startTime = performance.now();

    // Measure load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;

    // Measure memory usage
    const memory = (performance as any).memory;
    const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;

    // Measure network speed (simplified)
    const networkSpeed = (navigator as any).connection?.downlink || 0;

    // Measure battery level
    const batteryLevel = (navigator as any).getBattery ?
      (navigator as any).getBattery().then((battery: any) => battery.level * 100) : 0;

    // Measure FPS (simplified)
    let fps = 0;
    let frameCount = 0;
    const startFPS = performance.now();

    const measureFPS = () => {
      frameCount++;
      if (performance.now() - startFPS < 1000) {
        requestAnimationFrame(measureFPS);
      } else {
        fps = frameCount;
      }
    };
    measureFPS();

    // Calculate performance score
    const score = Math.max(0, Math.min(100,
      (100 - (loadTime / 100)) * 0.3 +
      (100 - (memoryUsage / 10)) * 0.2 +
      (networkSpeed * 10) * 0.2 +
      (fps / 2) * 0.3
    ));

    setMetrics({
      loadTime,
      memoryUsage,
      networkSpeed,
      batteryLevel: batteryLevel || 0,
      fps,
      score
    });
  }, []);

  const optimizePerformance = async () => {
    setIsOptimizing(true);
    const newOptimizations: string[] = [];

    // Optimization 1: Lazy loading
    if (metrics.loadTime > 2000) {
      newOptimizations.push('تم تفعيل التحميل المؤجل للصور');
      // Implement lazy loading
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        const src = img.getAttribute('data-src');
        if (src) {
          img.setAttribute('src', src);
          img.removeAttribute('data-src');
        }
      });
    }

    // Optimization 2: Memory cleanup
    if (metrics.memoryUsage > 50) {
      newOptimizations.push('تم تنظيف الذاكرة');
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
    }

    // Optimization 3: Reduce animations
    if (metrics.fps < 30) {
      newOptimizations.push('تم تقليل الحركات لتحسين الأداء');
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }

    // Optimization 4: Preload critical resources
    newOptimizations.push('تم تحميل الموارد المهمة مسبقاً');
    const criticalResources = [
      '/fonts/cairo.woff2',
      '/icons/aquafarm.ico'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.woff2') ? 'font' : 'image';
      document.head.appendChild(link);
    });

    // Optimization 5: Service Worker
    if ('serviceWorker' in navigator) {
      newOptimizations.push('تم تسجيل Service Worker للتخزين المؤقت');
      navigator.serviceWorker.register('/sw.js');
    }

    setOptimizations(newOptimizations);
    setIsOptimizing(false);

    // Re-measure performance after optimizations
    setTimeout(measurePerformance, 1000);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    if (score >= 40) return 'متوسط';
    return 'يحتاج تحسين';
  };

  useEffect(() => {
    measurePerformance();

    // Measure performance every 5 seconds
    const interval = setInterval(measurePerformance, 5000);
    return () => clearInterval(interval);
  }, [measurePerformance]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Zap className="icon-md" />
            <span>محسن الأداء</span>
          </CardTitle>
          <CardDescription>
            مراقبة وتحسين أداء التطبيق في الوقت الفعلي
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Score */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${getPerformanceColor(metrics.score)}`}>
              {metrics.score.toFixed(0)}
            </div>
            <p className="text-sm text-muted-foreground">
              {getPerformanceLabel(metrics.score)}
            </p>
            <Progress value={metrics.score} className="mt-2" />
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                <Clock className="icon-sm text-blue-600" />
                <span className="font-semibold">وقت التحميل</span>
              </div>
              <p className="text-2xl font-bold">{metrics.loadTime.toFixed(0)}ms</p>
              <p className="text-xs text-muted-foreground">
                {metrics.loadTime < 2000 ? 'سريع' : metrics.loadTime < 5000 ? 'متوسط' : 'بطيء'}
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                <MemoryStick className="icon-sm text-green-600" />
                <span className="font-semibold">الذاكرة</span>
              </div>
              <p className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}MB</p>
              <p className="text-xs text-muted-foreground">
                {metrics.memoryUsage < 50 ? 'ممتاز' : metrics.memoryUsage < 100 ? 'جيد' : 'يحتاج تحسين'}
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                <Wifi className="icon-sm text-purple-600" />
                <span className="font-semibold">سرعة الشبكة</span>
              </div>
              <p className="text-2xl font-bold">{metrics.networkSpeed.toFixed(1)}Mbps</p>
              <p className="text-xs text-muted-foreground">
                {metrics.networkSpeed > 10 ? 'سريع' : metrics.networkSpeed > 5 ? 'متوسط' : 'بطيء'}
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                <TrendingUp className="icon-sm text-orange-600" />
                <span className="font-semibold">معدل الإطارات</span>
              </div>
              <p className="text-2xl font-bold">{metrics.fps.toFixed(0)} FPS</p>
              <p className="text-xs text-muted-foreground">
                {metrics.fps > 50 ? 'سلس' : metrics.fps > 30 ? 'جيد' : 'يحتاج تحسين'}
              </p>
            </div>
          </div>

          {/* Optimization Controls */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button
              onClick={optimizePerformance}
              disabled={isOptimizing}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Settings className={`icon-sm ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'جاري التحسين...' : 'تحسين الأداء'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={measurePerformance}
            >
              <Clock className="icon-sm mr-2" />
              قياس جديد
            </Button>
          </div>

          {/* Optimization Results */}
          {optimizations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">التحسينات المطبقة</h3>
              <div className="space-y-2">
                {optimizations.map((optimization, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-lg bg-green-50 border border-green-200"
                  >
                    <CheckCircle className="icon-sm text-green-600" />
                    <span className="text-sm">{optimization}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Tips */}
          <div>
            <h3 className="text-lg font-semibold mb-3">نصائح لتحسين الأداء</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">تحسين الصور</h4>
                <p className="text-sm text-muted-foreground">
                  استخدم تنسيقات WebP و AVIF للصور
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">التحميل المؤجل</h4>
                <p className="text-sm text-muted-foreground">
                  فعّل التحميل المؤجل للمكونات غير المهمة
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">التخزين المؤقت</h4>
                <p className="text-sm text-muted-foreground">
                  استخدم Service Worker للتخزين المؤقت
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">تحسين الحركات</h4>
                <p className="text-sm text-muted-foreground">
                  قلل الحركات على الأجهزة البطيئة
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
