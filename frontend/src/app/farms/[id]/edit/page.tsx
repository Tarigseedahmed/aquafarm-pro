'use client'

/**
 * AquaFarm Pro - Edit Farm Page
 * Edit farm details and settings
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeft, 
  Save, 
  X,
  MapPin,
  Calendar,
  Activity
} from 'lucide-react'
import { farmService } from '@/services/farm.service'
import { Farm, UpdateFarmDto } from '@/services/mock.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function EditFarmPage() {
  const params = useParams()
  const router = useRouter()
  const farmId = params.id as string
  
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateFarmDto>({
    name: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    totalArea: undefined,
    description: '',
    status: 'active'
  })

  useEffect(() => {
    if (farmId) {
      loadFarmData()
    }
  }, [farmId])

  const loadFarmData = async () => {
    try {
      setLoading(true)
      const farmData = await farmService.getFarm(farmId)
      setFarm(farmData)
      setFormData({
        name: farmData.name,
        location: farmData.location || '',
        latitude: farmData.latitude,
        longitude: farmData.longitude,
        totalArea: farmData.totalArea,
        description: farmData.description || '',
        status: farmData.status
      })
    } catch (error: any) {
      const errorMessage = error?.message || 'حدث خطأ في تحميل بيانات المزرعة'
      toast.error(errorMessage)
      console.error('Failed to load farm data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!farm) return

    try {
      setSaving(true)
      await farmService.updateFarm(farm.id, formData)
      toast.success('تم تحديث المزرعة بنجاح')
      router.push(`/farms/${farm.id}`)
    } catch (error: any) {
      const errorMessage = error?.message || 'حدث خطأ في تحديث المزرعة'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof UpdateFarmDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="max-w-2xl">
            <div className="h-64 bg-gray-200 rounded"></div>
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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/farms/${farm.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">تعديل المزرعة</h1>
            <p className="text-gray-600">تعديل تفاصيل مزرعة {farm.name}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل المزرعة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم المزرعة *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="أدخل اسم المزرعة"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location">الموقع</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="أدخل موقع المزرعة"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">خط العرض</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude || ''}
                      onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="24.7136"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="longitude">خط الطول</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude || ''}
                      onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="46.6753"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="totalArea">المساحة الإجمالية (متر مربع)</Label>
                  <Input
                    id="totalArea"
                    type="number"
                    value={formData.totalArea || ''}
                    onChange={(e) => handleInputChange('totalArea', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="5000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">الحالة</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                      <SelectItem value="maintenance">صيانة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="أدخل وصف المزرعة"
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/farms/${farm.id}`)}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
