'use client'

/**
 * AquaFarm Pro - Interactive Water Quality Chart
 * Advanced interactive charts for water quality monitoring
 *
 * Note: This component uses inline styles for dynamic values (colors from chart library
 * and zoom transformations). This is intentional and necessary for the functionality.
 * Webhint warnings for inline styles can be safely ignored in this context.
 */

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react'

interface WaterQualityData {
  timestamp: string
  temperature: number
  ph: number
  dissolvedOxygen: number
  turbidity: number
  ammonia: number
  nitrite: number
  nitrate: number
}

interface InteractiveWaterQualityChartProps {
  data: WaterQualityData[]
  farmId?: string
  onDataPointClick?: (data: WaterQualityData) => void
  className?: string
}

const CHART_TYPES = {
  line: 'خطي',
  area: 'منطقة',
  bar: 'أعمدة'
} as const

const PARAMETERS = {
  temperature: { label: 'درجة الحرارة', unit: '°C', color: '#ef4444' },
  ph: { label: 'الأس الهيدروجيني', unit: '', color: '#3b82f6' },
  dissolvedOxygen: { label: 'الأكسجين المذاب', unit: 'mg/L', color: '#06b6d4' },
  turbidity: { label: 'العكارة', unit: 'NTU', color: '#8b5cf6' },
  ammonia: { label: 'الأمونيا', unit: 'mg/L', color: '#f59e0b' },
  nitrite: { label: 'النيتريت', unit: 'mg/L', color: '#10b981' },
  nitrate: { label: 'النيتريت', unit: 'mg/L', color: '#84cc16' }
} as const

export default function InteractiveWaterQualityChart(props: InteractiveWaterQualityChartProps) {
  const { data, className } = props
  const [chartType, setChartType] = useState<keyof typeof CHART_TYPES>('line')
  const [selectedParameters, setSelectedParameters] = useState<string[]>(['temperature', 'ph', 'dissolvedOxygen'])
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h')
  const [zoomLevel, setZoomLevel] = useState(1)
  const showTrends = true

  // Process data based on time range
  const processedData = useMemo(() => {
    const now = new Date()
    const timeRanges = {
      '1h': 1 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }

    const cutoff = new Date(now.getTime() - timeRanges[timeRange])

    return data
      .filter(item => new Date(item.timestamp) >= cutoff)
      .map(item => ({
        ...item,
        time: new Date(item.timestamp).toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        date: new Date(item.timestamp).toLocaleDateString('ar-EG')
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [data, timeRange])

  // Calculate trends
  const trends = useMemo(() => {
    if (!showTrends || processedData.length < 2) return {}

    const trends: Record<string, 'up' | 'down' | 'stable'> = {}

    selectedParameters.forEach(param => {
      const values = processedData.map(d => d[param as keyof WaterQualityData] as number)
      const first = values[0]
      const last = values[values.length - 1]
      const change = ((last - first) / first) * 100

      if (Math.abs(change) < 2) {
        trends[param] = 'stable'
      } else if (change > 0) {
        trends[param] = 'up'
      } else {
        trends[param] = 'down'
      }
    })

    return trends
  }, [processedData, selectedParameters, showTrends])

  const PARAM_COLOR_CLASS: Record<keyof typeof PARAMETERS, string> = {
    temperature: 'bg-[#ef4444]',
    ph: 'bg-[#3b82f6]',
    dissolvedOxygen: 'bg-[#06b6d4]',
    turbidity: 'bg-[#8b5cf6]',
    ammonia: 'bg-[#f59e0b]',
    nitrite: 'bg-[#10b981]',
    nitrate: 'bg-[#84cc16]'
  }

  // Custom tooltip
  type TooltipEntry = { color?: string; dataKey?: string; value?: number | string }
  interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string }
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => {
            const dotColor = entry.color || '#8884d8'
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: dotColor } as React.CSSProperties}
                />
                <span className="text-gray-600">{entry.dataKey}:</span>
                <span className="font-medium">{entry.value}</span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              stroke="#666"
              fontSize={12}
            />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Brush dataKey="time" height={30} stroke="#8884d8" />
            {selectedParameters.map(param => (
              <Line
                key={param}
                type="monotone"
                dataKey={param}
                stroke={PARAMETERS[param as keyof typeof PARAMETERS]?.color || '#8884d8'}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Brush dataKey="time" height={30} stroke="#8884d8" />
            {selectedParameters.map(param => (
              <Area
                key={param}
                type="monotone"
                dataKey={param}
                stackId="1"
                stroke={PARAMETERS[param as keyof typeof PARAMETERS]?.color || '#8884d8'}
                fill={PARAMETERS[param as keyof typeof PARAMETERS]?.color || '#8884d8'}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {selectedParameters.map(param => (
              <Bar
                key={param}
                dataKey={param}
                fill={PARAMETERS[param as keyof typeof PARAMETERS]?.color || '#8884d8'}
              />
            ))}
          </BarChart>
        )

      default:
        return <div />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            مراقبة جودة المياه التفاعلية
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(1)}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">نوع الرسم:</label>
            <Select value={chartType} onValueChange={(value: keyof typeof CHART_TYPES) => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHART_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">الفترة الزمنية:</label>
            <Select value={timeRange} onValueChange={(value: typeof timeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">ساعة</SelectItem>
                <SelectItem value="6h">6 ساعات</SelectItem>
                <SelectItem value="24h">يوم</SelectItem>
                <SelectItem value="7d">أسبوع</SelectItem>
                <SelectItem value="30d">شهر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Parameter Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">المعايير المحددة:</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PARAMETERS).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedParameters.includes(key) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedParameters(prev =>
                    prev.includes(key)
                      ? prev.filter(p => p !== key)
                      : [...prev, key]
                  )
                }}
                className="flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${PARAM_COLOR_CLASS[key as keyof typeof PARAMETERS]}`} />
                {config.label}
                {trends[key] && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {trends[key] === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : trends[key] === 'down' ? (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    ) : (
                      <Activity className="w-3 h-3 text-gray-500" />
                    )}
                  </motion.div>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div
          className="w-full h-96 origin-top-left"
          style={{ transform: `scale(${zoomLevel})` } as React.CSSProperties}
        >
          <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>
        </div>

        {/* Trends Summary */}
        {showTrends && Object.keys(trends).length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">ملخص الاتجاهات:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(trends).map(([param, trend]) => (
                <div key={param} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${PARAM_COLOR_CLASS[param as keyof typeof PARAMETERS]}`} />
                  <span className="text-sm text-gray-600">
                    {PARAMETERS[param as keyof typeof PARAMETERS]?.label}:
                  </span>
                  <div className="flex items-center gap-1">
                    {trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <Activity className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-sm font-medium">
                      {trend === 'up' ? 'ارتفاع' : trend === 'down' ? 'انخفاض' : 'مستقر'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
