'use client'

/**
 * AquaFarm Pro - Water Quality Details Page
 * Individual water quality monitoring and analysis
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import PageNavigation from '@/components/Navigation/PageNavigation'
import { 
  ArrowLeft, 
  Droplets, 
  Thermometer, 
  Activity,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Mock data for water quality
const mockWaterQualityData = {
  id: '1',
  farmId: '1',
  farmName: 'مزرعة الأسماك الرئيسية',
  location: 'الرياض، المملكة العربية السعودية',
  readings: [
    {
      id: '1',
      timestamp: '2024-01-15T14:30:00Z',
      temperature: 24.5,
      ph: 7.2,
      dissolvedOxygen: 8.5,
      turbidity: 2.1,
      ammonia: 0.3,
      nitrite: 0.1,
      nitrate: 5.2,
      status: 'excellent'
    },
    {
      id: '2',
      timestamp: '2024-01-15T10:15:00Z',
      temperature: 23.8,
      ph: 7.1,
      dissolvedOxygen: 8.2,
      turbidity: 2.3,
      ammonia: 0.4,
      nitrite: 0.2,
      nitrate: 5.8,
      status: 'good'
    },
    {
      id: '3',
      timestamp: '2024-01-15T06:00:00Z',
      temperature: 22.1,
      ph: 6.9,
      dissolvedOxygen: 7.8,
      turbidity: 2.8,
      ammonia: 0.5,
      nitrite: 0.3,
      nitrate: 6.2,
      status: 'warning'
    }
  ],
  alerts: [
    {
      id: '1',
      type: 'warning',
      message: 'انخفاض في مستوى الأكسجين المذاب',
      timestamp: '2024-01-15T06:00:00Z',
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      message: 'تحسن في جودة المياه',
      timestamp: '2024-01-15T10:15:00Z',
      resolved: true
    }
  ],
  trends: {
    temperature: { trend: 'stable', change: 0.2 },
    ph: { trend: 'improving', change: 0.3 },
    dissolvedOxygen: { trend: 'improving', change: 0.7 },
    turbidity: { trend: 'stable', change: -0.2 }
  }
}

export default function WaterQualityDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const waterQualityId = params.id as string
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (waterQualityId) {
      loadWaterQualityData()
    }
  }, [waterQualityId])

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

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await loadWaterQualityData()
      toast.success('تم تحديث البيانات')
    } catch (error: any) {
      toast.error('حدث خطأ في تحديث البيانات')
    } finally {
      setRefreshing(false)
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

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'info': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'critical': return 'حرج'
      case 'warning': return 'تحذير'
      case 'info': return 'معلومات'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded mb-6"></div>
            </div>
            <div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">بيانات جودة المياه غير متوفرة</h1>
          <p className="text-gray-600 mb-6">لا توجد بيانات جودة مياه متاحة للمزرعة المطلوبة</p>
          <Button onClick={() => router.push('/farms')}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للمزارع
          </Button>
        </div>
      </div>
    )
  }

  const latestReading = data.readings[0]

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Enhanced Navigation */}
      <PageNavigation
        title="جودة المياه"
        subtitle={`${data.farmName} • ${data.location}`}
        customBackPath="/water-quality"
        customBackLabel="العودة لمراقبة جودة المياه"
        actions={[
          {
            label: 'تحديث',
            icon: RefreshCw,
            onClick: handleRefresh,
            disabled: refreshing,
            variant: 'outline'
          }
        ]}
      />

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درجة الحرارة</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestReading.temperature}°C</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(latestReading.status)}>
                {getStatusText(latestReading.status)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {data.trends.temperature.trend === 'improving' ? 'تحسن' : 'مستقر'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأس الهيدروجيني</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestReading.ph}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(latestReading.status)}>
                {getStatusText(latestReading.status)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {data.trends.ph.trend === 'improving' ? 'تحسن' : 'مستقر'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأكسجين المذاب</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestReading.dissolvedOxygen} mg/L</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(latestReading.status)}>
                {getStatusText(latestReading.status)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {data.trends.dissolvedOxygen.trend === 'improving' ? 'تحسن' : 'مستقر'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العكارة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestReading.turbidity} NTU</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(latestReading.status)}>
                {getStatusText(latestReading.status)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {data.trends.turbidity.trend === 'improving' ? 'تحسن' : 'مستقر'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detailed Readings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>القراءات التفصيلية</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="current">الحالية</TabsTrigger>
                  <TabsTrigger value="history">التاريخ</TabsTrigger>
                  <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
                </TabsList>
                
                <TabsContent value="current" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">درجة الحرارة</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">{latestReading.temperature}°C</span>
                        <Progress value={75} className="flex-1" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">الأس الهيدروجيني</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">{latestReading.ph}</span>
                        <Progress value={80} className="flex-1" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">الأكسجين المذاب</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">{latestReading.dissolvedOxygen} mg/L</span>
                        <Progress value={85} className="flex-1" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">العكارة</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">{latestReading.turbidity} NTU</span>
                        <Progress value={70} className="flex-1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      آخر قراءة: {new Date(latestReading.timestamp).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  <div className="space-y-3">
                    {data.readings.map((reading: any) => (
                      <div key={reading.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <div className="font-medium">{reading.temperature}°C</div>
                            <div className="text-gray-500">الحرارة</div>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{reading.ph}</div>
                            <div className="text-gray-500">الأس الهيدروجيني</div>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{reading.dissolvedOxygen} mg/L</div>
                            <div className="text-gray-500">الأكسجين</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(reading.status)}>
                            {getStatusText(reading.status)}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(reading.timestamp).toLocaleString('ar-EG')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="trends" className="space-y-4">
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">الرسوم البيانية للاتجاهات قيد التطوير</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Notifications */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                التنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.alerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === 'critical' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getAlertTypeColor(alert.type)}>
                          {getAlertTypeText(alert.type)}
                        </Badge>
                        {alert.resolved && (
                          <Badge className="bg-green-100 text-green-800">محلول</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
