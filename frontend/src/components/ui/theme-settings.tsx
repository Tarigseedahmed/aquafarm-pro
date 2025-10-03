'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor,
  Check,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchOptimized } from '@/components/ui/touch-optimized';
import { cn } from '@/lib/utils';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const themes = [
  {
    id: 'aqua',
    name: 'Aqua Green',
    description: 'الثيم الأصلي للمزرعة المائية',
    colors: ['#f0fdfa', '#14b8a6', '#0d9488', '#115e59'],
    icon: '🐟'
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'ثيم المحيط الأزرق الهادئ',
    colors: ['#f0f9ff', '#0ea5e9', '#0284c7', '#075985'],
    icon: '🌊'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'ثيم الغابة الأخضر الطبيعي',
    colors: ['#f0fdf4', '#22c55e', '#16a34a', '#15803d'],
    icon: '🌲'
  }
];

const colorModes = [
  {
    id: 'light',
    name: 'فاتح',
    description: 'وضع النهار',
    icon: Sun
  },
  {
    id: 'dark',
    name: 'داكن',
    description: 'وضع الليل',
    icon: Moon
  },
  {
    id: 'system',
    name: 'النظام',
    description: 'يتبع إعدادات النظام',
    icon: Monitor
  }
];

export default function ThemeSettings({ isOpen, onClose }: ThemeSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState('aqua');
  const [selectedMode, setSelectedMode] = useState('system');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-color') || 'aqua';
      const savedMode = localStorage.getItem('theme-mode') || 'system';
      setSelectedTheme(savedTheme);
      setSelectedMode(savedMode);
    }
  }, []);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem('theme-color', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
    setTheme(mode);
    localStorage.setItem('theme-mode', mode);
  };

  const applySettings = () => {
    // Apply theme and mode
    document.documentElement.setAttribute('data-theme', selectedTheme);
    setTheme(selectedMode);
    
    // Save to localStorage
    localStorage.setItem('theme-color', selectedTheme);
    localStorage.setItem('theme-mode', selectedMode);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Palette className="icon-md text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">إعدادات الثيمات</CardTitle>
                    <CardDescription>
                      اختر الثيم والوضع المناسب لك
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Color Themes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">ألوان الثيم</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themes.map((themeOption) => (
                    <TouchOptimized
                      key={themeOption.id}
                      as="button"
                      onClick={() => handleThemeChange(themeOption.id)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all duration-200',
                        'hover:shadow-md active:scale-95',
                        selectedTheme === themeOption.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{themeOption.icon}</span>
                        {selectedTheme === themeOption.id && (
                          <Check className="icon-sm text-primary" />
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{themeOption.name}</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {themeOption.description}
                      </p>
                      <div className="flex space-x-1 rtl:space-x-reverse">
                        {themeOption.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </TouchOptimized>
                  ))}
                </div>
              </div>

              {/* Color Mode */}
              <div>
                <h3 className="text-lg font-semibold mb-4">وضع الألوان</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {colorModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <TouchOptimized
                        key={mode.id}
                        as="button"
                        onClick={() => handleModeChange(mode.id)}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all duration-200',
                          'hover:shadow-md active:scale-95',
                          selectedMode === mode.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Icon className="icon-md" />
                          {selectedMode === mode.id && (
                            <Check className="icon-sm text-primary" />
                          )}
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{mode.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {mode.description}
                        </p>
                      </TouchOptimized>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">معاينة الثيم</h3>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🐟</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">AquaFarm Pro</h4>
                      <p className="text-sm text-muted-foreground">منصة إدارة المزارع المائية</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-primary/10 rounded text-sm">مؤشر الأداء</div>
                    <div className="p-2 bg-secondary rounded text-sm">إحصائيات</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  إلغاء
                </Button>
                <Button onClick={applySettings} className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Sparkles className="icon-sm" />
                  <span>تطبيق الإعدادات</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
