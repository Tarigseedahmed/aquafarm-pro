'use client'

/**
 * AquaFarm Pro - Farm Details Page
 * Individual farm details and management
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import PageNavigation from '@/components/Navigation/PageNavigation'
import { 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Activity, 
  TrendingUp,
  Users,
  Droplets,
  Fish,
  Edit,
  Trash2,
  ArrowLeft,
  BarChart3,
  Settings
} from 'lucide-react'
import { farmService } from '@/services/farm.service'
import { Farm, FarmStats } from '@/services/mock.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function FarmDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const farmId = params.id as string
  
  const [farm, setFarm] = useState<Farm | null>(null)
  const [stats, setStats] = useState<FarmStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (farmId) {
      loadFarmData()
    }
  }, [farmId])

  const loadFarmData = async () => {
    try {
      setLoading(true)
      const [farmData, statsData] = await Promise.all([
        farmService.getFarm(farmId),
        farmService.getFarmStats(farmId)
      ])
      setFarm(farmData)
      setStats(statsData)
    } catch (error: any) {
      const errorMessage = error?.message || 'حدث خطأ في تحميل بيانات المزرعة'
      toast.error(errorMessage)
      console.error('Failed to load farm data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFarm = async () => {
    if (!farm) return
    
    try {
      await farmService.deleteFarm(farm.id)
      toast.success('تم حذف المزرعة بنجاح')
      router.push('/farms')
    } catch (error: any) {
      const errorMessage = error?.message || 'حدث خطأ في حذف المزرعة'
      toast.error(errorMessage)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800' 
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط'
      case 'inactive': return 'غير نشط'
      case 'maintenance': return 'صيانة'
      default: return status
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

  if (!farm) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">المزرعة غير موجودة</h1>
          <p className="text-gray-600 mb-6">المزرعة المطلوبة غير موجودة أو تم حذفها</p>
          <Button onClick={() => router.push('/farms')}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للمزارع
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Enhanced Navigation */}
      <PageNavigation
        title={farm.name}
        subtitle={`${farm.location || 'غير محدد'} • تم الإنشاء: ${new Date(farm.createdAt).toLocaleDateString('ar-EG')}`}
        customBackPath="/farms"
        customBackLabel="العودة للمزارع"
        actions={[
          {
            label: 'تعديل',
            icon: Edit,
            onClick: () => router.push(`/farms/${farm.id}/edit`),
            variant: 'outline'
          },
          {
            label: 'حذف',
            icon: Trash2,
            onClick: () => setShowDeleteDialog(true),
            variant: 'destructive'
          }
        ]}
        onRefresh={loadFarmData}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الأحواض</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ponds.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.ponds.active} نشط
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الأسماك</CardTitle>
              <Fish className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fish.totalFish.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.fish.totalBatches} دفعة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حجم المياه</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ponds.totalVolume.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">لتر</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">جودة المياه</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.waterQuality.totalReadings}</div>
              <p className="text-xs text-muted-foreground">قراءة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Farm Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المزرعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">الاسم</label>
                  <p className="text-lg">{farm.name}</p>
                </div>
                
                {farm.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">الوصف</label>
                    <p className="text-gray-700">{farm.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">الموقع</label>
                    <p className="text-gray-700">{farm.location || 'غير محدد'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">المساحة</label>
                    <p className="text-gray-700">
                      {farm.totalArea ? `${farm.totalArea.toLocaleString()} م²` : 'غير محدد'}
                    </p>
                  </div>
                </div>

                {farm.owner && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">المالك</label>
                    <p className="text-gray-700">{farm.owner.name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Water Quality */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>جودة المياه</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.waterQuality.lastReading ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">درجة الحرارة</span>
                      <span className="text-lg font-bold">{stats.waterQuality.lastReading.temperature}°C</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">الأس الهيدروجيني</span>
                      <span className="text-lg font-bold">{stats.waterQuality.lastReading.ph}</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">الأكسجين المذاب</span>
                      <span className="text-lg font-bold">{stats.waterQuality.lastReading.dissolvedOxygen} mg/L</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    آخر قراءة: {new Date(stats.waterQuality.lastReading.recordedAt).toLocaleString('ar-EG')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-center">لا توجد قراءات متاحة</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteFarm}
        title="حذف المزرعة"
        description={`هل أنت متأكد من حذف مزرعة "${farm.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
      />
    </div>
  )
}
