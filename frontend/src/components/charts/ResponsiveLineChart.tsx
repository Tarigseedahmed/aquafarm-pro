'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import ResponsiveChart from './ResponsiveChart';

interface ResponsiveLineChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  title: string;
  description?: string;
  color?: string;
  height?: number;
  showLegend?: boolean;
  multipleLines?: Array<{
    dataKey: string;
    color: string;
    name: string;
  }>;
}

export default function ResponsiveLineChart({
  data,
  dataKey,
  xAxisKey,
  title,
  description,
  color = '#0ea5e9',
  height = 300,
  showLegend = false,
  multipleLines = []
}: ResponsiveLineChartProps) {
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
          margin: { top: 20, right: 10, left: 10, bottom: 20 },
          fontSize: 12,
          tickFormatter: (value: any) => String(value).slice(0, 4)
        };
      case 'tablet':
        return {
          margin: { top: 20, right: 30, left: 20, bottom: 20 },
          fontSize: 14,
          tickFormatter: (value: any) => String(value)
        };
      case 'desktop':
        return {
          margin: { top: 20, right: 30, left: 20, bottom: 20 },
          fontSize: 14,
          tickFormatter: (value: any) => String(value)
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
        <LineChart data={data} {...responsiveProps}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="currentColor" 
            opacity={0.1}
          />
          <XAxis 
            dataKey={xAxisKey}
            fontSize={responsiveProps.fontSize}
            tickFormatter={responsiveProps.tickFormatter}
          />
          <YAxis 
            fontSize={responsiveProps.fontSize}
            tickFormatter={(value) => `${value}°`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          {showLegend && <Legend />}
          
          {multipleLines.length > 0 ? (
            multipleLines.map((line, index) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={3}
                dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
                name={line.name}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ResponsiveChart>
  );
}
