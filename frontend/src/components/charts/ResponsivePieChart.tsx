'use client';

import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { motion } from 'framer-motion';
import ResponsiveChart from './ResponsiveChart';

interface ResponsivePieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title: string;
  description?: string;
  height?: number;
  showLegend?: boolean;
  showLabel?: boolean;
}

export default function ResponsivePieChart({
  data,
  title,
  description,
  height = 300,
  showLegend = true,
  showLabel = false
}: ResponsivePieChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const getResponsiveProps = () => {
    switch (screenSize) {
      case 'mobile':
        return {
          cx: '50%',
          cy: '50%',
          outerRadius: 80,
          innerRadius: 40,
          fontSize: 12,
          legendPosition: 'bottom'
        };
      case 'tablet':
        return {
          cx: '50%',
          cy: '50%',
          outerRadius: 100,
          innerRadius: 50,
          fontSize: 14,
          legendPosition: 'right'
        };
      case 'desktop':
        return {
          cx: '50%',
          cy: '50%',
          outerRadius: 120,
          innerRadius: 60,
          fontSize: 14,
          legendPosition: 'right'
        };
    }
  };

  const responsiveProps = getResponsiveProps();

  return (
    <ResponsiveChart
      title={title}
      description={description}
      height={height}
      isFullscreen={isFullscreen}
      onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx={responsiveProps.cx}
            cy={responsiveProps.cy}
            outerRadius={responsiveProps.outerRadius}
            innerRadius={responsiveProps.innerRadius}
            paddingAngle={2}
            dataKey="value"
            label={showLabel ? ((props: PieLabelRenderProps) => {
              const { name, percent } = props as { name?: string; percent?: number };
              const pct = ((percent ?? 0) * 100).toFixed(0);
              return `${name ?? ''} ${pct}%`;
            }) : false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: any, name: string) => [value, name]}
          />
          {showLegend && (
            <Legend 
              verticalAlign={responsiveProps.legendPosition === 'bottom' ? 'bottom' : 'middle'}
              align={responsiveProps.legendPosition === 'bottom' ? 'center' : 'right'}
              fontSize={responsiveProps.fontSize}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </ResponsiveChart>
  );
}
