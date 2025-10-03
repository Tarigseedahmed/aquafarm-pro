'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Download,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

interface ResponsiveChartProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height?: number;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

export default function ResponsiveChart({
  title,
  description,
  icon,
  children,
  className = '',
  height = 300,
  isFullscreen = false,
  onFullscreenToggle
}: ResponsiveChartProps) {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [chartHeight, setChartHeight] = useState(height);

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
        setChartHeight(250);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setChartHeight(300);
      } else {
        setScreenSize('desktop');
        setChartHeight(height);
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, [height]);

  const getScreenIcon = () => {
    switch (screenSize) {
      case 'mobile': return <Smartphone className="icon-sm" />;
      case 'tablet': return <Tablet className="icon-sm" />;
      case 'desktop': return <Monitor className="icon-sm" />;
    }
  };

  const getResponsiveGrid = () => {
    if (isFullscreen) return 'grid-cols-1';
    
    switch (screenSize) {
      case 'mobile': return 'grid-cols-1';
      case 'tablet': return 'grid-cols-1 lg:grid-cols-2';
      case 'desktop': return 'grid-cols-1 lg:grid-cols-2';
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`${getResponsiveGrid()} ${className}`}
    >
      <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {icon}
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* Screen Size Indicator */}
            <div className="flex items-center space-x-1 rtl:space-x-reverse text-xs text-muted-foreground">
              {getScreenIcon()}
              <span className="hidden sm:inline">
                {screenSize === 'mobile' ? 'جوال' : 
                 screenSize === 'tablet' ? 'تابلت' : 'سطح المكتب'}
              </span>
            </div>
            
            {/* Chart Controls */}
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <Button
                variant="ghost"
                size="sm"
                onClick={onFullscreenToggle}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? <Minimize2 className="icon-sm" /> : <Maximize2 className="icon-sm" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="icon-sm" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  // Export chart functionality
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const link = document.createElement('a');
                    link.download = `${title}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                  }
                }}
              >
                <Download className="icon-sm" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div 
            className="w-full"
            style={{ height: `${chartHeight}px` }}
          >
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
