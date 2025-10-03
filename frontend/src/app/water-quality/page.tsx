'use client'

/**
 * AquaFarm Pro - Water Quality Monitoring Page
 * Monitor water quality across all farms
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import PageNavigation from '@/components/Navigation/PageNavigation'
import { 
  Droplets, 
  Thermometer, 
  Activity,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  RefreshCw,
  Filter,
  Search,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Mock data for water quality monitoring
const mockWaterQualityData = [
  {
    id: '1',
    farmId: '1',
    farmName: 'مزرعة الأسماك الرئيسية',
    location: 'الرياض، المملكة العربية السعودية',
    lastReading: {
      timestamp: '2024-01-15T14:30:00Z',
      temperature: 24.5,
      ph: 7.2,
      dissolvedOxygen: 8.5,
      turbidity: 2.1,
      status: 'excellent'
    },
    alerts: 0,
    trend: 'improving'
  },
  {
    id: '2',
    farmId: '2',
    farmName: 'مزرعة الأسماك الشمالية',
    location: 'الدمام، المملكة العربية السعودية',
    lastReading: {
      timestamp: '2024-01-15T13:45:00Z',
      temperature: 22.8,
      ph: 7.0,
      dissolvedOxygen: 7.8,
      turbidity: 2.8,
      status: 'good'
    },
    alerts: 1,
    trend: 'stable'
  }
]

export default function WaterQualityPage() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [trendFilter, setTrendFilter] = useState('all')

  useEffect(() => {
    loadWaterQualityData()
  }, [])

  const loadWaterQualityData = async () => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setData(mockWaterQualityData)
    } catch (error: any) {
      const errorMessage = error?.message || 'حدث خطأ في تحميل بيانات جودة المياه'
      toast.error(errorMessage)
      console.error('Failed to load water quality data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'ممتاز'
      case 'good': return 'جيد'
      case 'warning': return 'تحذير'
      case 'critical': return 'حرج'
      default: return status
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600'
      case 'stable': return 'text-blue-600'
      case 'declining': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving': return 'تحسن'
      case 'stable': return 'مستقر'
      case 'declining': return 'تراجع'
      default: return trend
    }
  }

  const filteredData = data.filter(item => {
    const matchesSearch = item.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.lastReading.status === statusFilter
    const matchesTrend = trendFilter === 'all' || item.trend === trendFilter
    
    return matchesSearch && matchesStatus && matchesTrend
  })

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Enhanced Navigation */}
      <PageNavigation
        title="مراقبة جودة المياه"
        subtitle="مراقبة وتحليل جودة المياه في جميع المزارع"
        actions={[
          {
            label: 'تحديث',
            icon: RefreshCw,
            onClick: loadWaterQualityData,
            variant: 'outline'
          }
        ]}
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
              <Input
                placeholder="البحث في المزارع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="excellent">ممتاز</SelectItem>
                <SelectItem value="good">جيد</SelectItem>
                <SelectItem value="warning">تحذير</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={trendFilter} onValueChange={setTrendFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الاتجاه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الاتجاهات</SelectItem>
                <SelectItem value="improving">تحسن</SelectItem>
                <SelectItem value="stable">مستقر</SelectItem>
                <SelectItem value="declining">تراجع</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Water Quality Cards */}
      {!loading && filteredData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900 mb-1">
                      {item.farmName}
                    </CardTitle>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Activity className="w-4 h-4 ml-1" />
                      {item.location}
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.lastReading.status)}>
                    {getStatusText(item.lastReading.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Water Quality Parameters */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Thermometer className="w-4 h-4 ml-1 text-blue-500" />
                      <span className="text-gray-600">الحرارة:</span>
                      <span className="font-medium mr-1">{item.lastReading.temperature}°C</span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 ml-1 text-green-500" />
                      <span className="text-gray-600">الأس الهيدروجيني:</span>
                      <span className="font-medium mr-1">{item.lastReading.ph}</span>
                    </div>
                    <div className="flex items-center">
                      <Droplets className="w-4 h-4 ml-1 text-cyan-500" />
                      <span className="text-gray-600">الأكسجين:</span>
                      <span className="font-medium mr-1">{item.lastReading.dissolvedOxygen} mg/L</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 ml-1 text-purple-500" />
                      <span className="text-gray-600">العكارة:</span>
                      <span className="font-medium mr-1">{item.lastReading.turbidity} NTU</span>
                    </div>
                  </div>

                  {/* Alerts */}
                  {item.alerts > 0 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">{item.alerts} تنبيه</span>
                    </div>
                  )}

                  {/* Trend */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">الاتجاه:</span>
                    <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                      {getTrendText(item.trend)}
                    </span>
                  </div>

                  {/* Last Reading Time */}
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Clock className="w-3 h-3" />
                    آخر قراءة: {new Date(item.lastReading.timestamp).toLocaleString('ar-EG')}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/water-quality/${item.id}`)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredData.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'لم يتم العثور على مزارع' : 'لا توجد بيانات جودة مياه'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? `لم يتم العثور على مزارع تطابق "${searchTerm}"`
              : 'لا توجد بيانات جودة مياه متاحة للمزارع'
            }
          </p>
        </div>
      )}
    </div>
  )
}