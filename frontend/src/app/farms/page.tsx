'use client'

/**
 * AquaFarm Pro - Phase 1: MVP Development  
 * Farm Management Page - List and manage farms
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  Plus, 
  Search, 
  MapPin, 
  Activity, 
  TrendingUp,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { farmService } from '@/services/farm.service'
import { Farm } from '@/types/farm.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateFarmModal } from '@/components/farms/CreateFarmModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function FarmsPage() {
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMyFarms, setShowMyFarms] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null)

  // Load farms
  useEffect(() => {
    loadFarms()
  }, [showMyFarms, searchTerm])

  const loadFarms = async () => {
    try {
      setLoading(true)
      let data: Farm[]
      
      if (searchTerm) {
        data = await farmService.searchFarms(searchTerm)
      } else if (showMyFarms) {
        data = await farmService.getMyFarms()
      } else {
        data = await farmService.getAllFarms()
      }
      
      setFarms(data)
    } catch (error) {
      toast.error('فشل في تحميل المزارع')
      console.error('Failed to load farms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFarm = async (farmData: any) => {
    try {
      await farmService.createFarm(farmData)
      toast.success('تم إنشاء المزرعة بنجاح')
      setShowCreateModal(false)
      loadFarms()
    } catch (error: any) {
      toast.error(error.message || 'فشل في إنشاء المزرعة')
    }
  }

  const handleDeleteFarm = async () => {
    if (!farmToDelete) return
    
    try {
      await farmService.deleteFarm(farmToDelete.id)
      toast.success('تم حذف المزرعة بنجاح')
      setFarmToDelete(null)
      loadFarms()
    } catch (error: any) {
      toast.error(error.message || 'فشل في حذف المزرعة')
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

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المزارع</h1>
          <p className="text-gray-600">أضف وأدير مزارع الأسماك الخاصة بك</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة مزرعة جديدة
        </Button>
      </div>

      {/* Filters and Search */}
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
            <Button
              variant={showMyFarms ? "default" : "outline"}
              onClick={() => setShowMyFarms(!showMyFarms)}
              className="whitespace-nowrap"
            >
              {showMyFarms ? 'جميع المزارع' : 'مزارعي فقط'}
            </Button>
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

      {/* Farms Grid */}
      {!loading && farms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <Card key={farm.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900 mb-1">
                      {farm.name}
                    </CardTitle>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 ml-1" />
                      {farm.location || 'غير محدد'}
                    </div>
                  </div>
                  <Badge className={getStatusColor(farm.status)}>
                    {getStatusText(farm.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Farm Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 ml-1 text-blue-500" />
                      <span className="text-gray-600">الأحواض:</span>
                      <span className="font-medium mr-1">{farm.pondCount || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 ml-1 text-green-500" />
                      <span className="text-gray-600">المساحة:</span>
                      <span className="font-medium mr-1">
                        {farm.totalArea ? `${farm.totalArea.toLocaleString()} م²` : 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {farm.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {farm.description}
                    </p>
                  )}

                  {/* Created Date */}
                  <p className="text-gray-400 text-xs">
                    تم الإنشاء: {new Date(farm.createdAt).toLocaleDateString('ar-EG')}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/farms/${farm.id}`)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/farms/${farm.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFarmToDelete(farm)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && farms.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'لم يتم العثور على مزارع' : 'لا توجد مزارع'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? `لم يتم العثور على مزارع تطابق "${searchTerm}"`
              : 'ابدأ بإضافة مزرعة جديدة لإدارة أسماكك'
            }
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة مزرعة جديدة
            </Button>
          )}
        </div>
      )}

      {/* Create Farm Modal */}
      <CreateFarmModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFarm}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!farmToDelete}
        onClose={() => setFarmToDelete(null)}
        onConfirm={handleDeleteFarm}
        title="حذف المزرعة"
        description={`هل أنت متأكد من حذف مزرعة "${farmToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
      />
    </div>
  )
}