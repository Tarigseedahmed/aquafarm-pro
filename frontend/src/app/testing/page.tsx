'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TestTube, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Monitor,
  Palette,
  Zap,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ResponsiveTestTool from '@/components/testing/ResponsiveTestTool';
import ThemeTestTool from '@/components/testing/ThemeTestTool';
import PerformanceOptimizer from '@/components/performance/PerformanceOptimizer';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

export default function TestingPage() {
  const [activeTest, setActiveTest] = useState<string>('responsive');
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const testSuites: TestSuite[] = [
    {
      id: 'responsive',
      name: 'اختبار الاستجابة',
      description: 'اختبار التطبيق على أحجام شاشات مختلفة',
      icon: Monitor,
      component: ResponsiveTestTool,
      status: 'pending'
    },
    {
      id: 'themes',
      name: 'اختبار الثيمات',
      description: 'اختبار نظام الثيمات وعدم وجود FOUC',
      icon: Palette,
      component: ThemeTestTool,
      status: 'pending'
    },
    {
      id: 'performance',
      name: 'تحسين الأداء',
      description: 'مراقبة وتحسين أداء التطبيق',
      icon: Zap,
      component: PerformanceOptimizer,
      status: 'pending'
    }
  ];

  const runAllTests = async () => {
    for (const test of testSuites) {
      setActiveTest(test.id);
      // Simulate test running
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="icon-sm text-green-600" />;
      case 'failed': return <XCircle className="icon-sm text-red-600" />;
      case 'running': return <div className="icon-sm animate-spin">⏳</div>;
      default: return <div className="icon-sm text-gray-400">⏸️</div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ActiveComponent = testSuites.find(test => test.id === activeTest)?.component;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-foreground mb-4">
              مركز اختبار AquaFarm Pro
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              اختبار شامل للتطبيق لضمان الجودة والأداء المثالي على جميع الأجهزة
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Test Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <TestTube className="icon-md" />
                  <span>مجموعات الاختبار</span>
                </CardTitle>
                <CardDescription>
                  اختر مجموعة الاختبار المناسبة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {testSuites.map((test) => {
                  const Icon = test.icon;
                  return (
                    <Button
                      key={test.id}
                      variant={activeTest === test.id ? 'default' : 'ghost'}
                      className="w-full justify-start h-auto p-4"
                      onClick={() => setActiveTest(test.id)}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse w-full">
                        <Icon className="icon-sm" />
                        <div className="flex-1 text-right">
                          <div className="font-medium">{test.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {test.description}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {getStatusIcon(test.status)}
                          <Badge className={getStatusColor(test.status)}>
                            {test.status === 'completed' ? 'مكتمل' : 
                             test.status === 'failed' ? 'فشل' : 
                             test.status === 'running' ? 'جاري' : 'في الانتظار'}
                          </Badge>
                        </div>
                      </div>
                    </Button>
                  );
                })}
                
                <div className="pt-4 border-t">
                  <Button 
                    onClick={runAllTests}
                    className="w-full"
                    variant="outline"
                  >
                    <BarChart3 className="icon-sm mr-2" />
                    تشغيل جميع الاختبارات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTest}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {ActiveComponent && <ActiveComponent />}
            </motion.div>
          </div>
        </div>

        {/* Test Summary */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <BarChart3 className="icon-md" />
                <span>ملخص الاختبارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {testSuites.filter(t => t.status === 'completed').length}
                  </div>
                  <div className="text-sm text-green-800">اختبارات مكتملة</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">
                    {testSuites.filter(t => t.status === 'running').length}
                  </div>
                  <div className="text-sm text-yellow-800">اختبارات جارية</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {testSuites.filter(t => t.status === 'failed').length}
                  </div>
                  <div className="text-sm text-red-800">اختبارات فاشلة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
