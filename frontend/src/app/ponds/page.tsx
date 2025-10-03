'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { pondsService, Pond, PondsResponse } from '@/services/ponds.service';
import { farmService, Farm } from '@/services/farm.service';
import { useTranslation } from 'react-i18next';

interface PondFormData {
  farmId: string;
  name: string;
  description?: string;
  area: number;
  depth: number;
  maxCapacity: number;
  volume?: number;
  shape?: string;
  equipment?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  managedById: string;
  status: 'active' | 'inactive' | 'maintenance' | 'cleaning' | 'under_construction';
}


const statusColors = {
  active: 'text-green-600 bg-green-100',
  inactive: 'text-gray-600 bg-gray-100',
  maintenance: 'text-yellow-600 bg-yellow-100',
  cleaning: 'text-blue-600 bg-blue-100',
  under_construction: 'text-orange-600 bg-orange-100',
};

const statusLabels = {
  active: 'نشط',
  inactive: 'غير نشط',
  maintenance: 'تحت الصيانة',
  cleaning: 'تحت التنظيف',
  under_construction: 'تحت الإنشاء',
};

export default function PondsPage() {
  const { t } = useTranslation('common');
  const searchParams = useSearchParams();
  const farmIdFromUrl = searchParams.get('farmId');

  const [ponds, setPonds] = useState<Pond[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<string>(farmIdFromUrl || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingPond, setEditingPond] = useState<Pond | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState<PondFormData>({
    farmId: farmIdFromUrl || '',
    name: '',
    description: '',
    area: 0,
    depth: 0,
    maxCapacity: 0,
    shape: 'rectangular',
    equipment: [],
    notes: '',
    managedById: '',
    status: 'active',
  });

  const loadFarms = async () => {
    try {
      const farmsData = await farmService.getAllFarms();
      setFarms(farmsData);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(errorMessage);
      console.error('Error loading farms:', error);
    }
  };

  const loadPonds = useCallback(async () => {
    setLoading(true);
    try {
      const response: PondsResponse = await pondsService.getPonds(
        pagination.page,
        pagination.limit,
        searchTerm,
        selectedFarm || undefined
      );
      
      setPonds(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(errorMessage);
      console.error('Error loading ponds:', error);
      setPonds([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFarm, searchTerm, pagination.page, pagination.limit]);

  // Load initial data
  useEffect(() => {
    loadFarms();
    loadPonds();
  }, [loadPonds]);

  // Reload ponds when farm filter changes
  useEffect(() => {
    loadPonds();
  }, [selectedFarm, loadPonds]);

  const filteredPonds = ponds.filter(pond => {
    const matchesSearch = pond.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || pond.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.farmId) {
      toast.error(t('common.error'));
      return;
    }

    try {
      if (editingPond) {
        // Update existing pond
        await pondsService.updatePond(editingPond.id, {
          id: editingPond.id,
          ...formData,
        });
        toast.success(t('common.success'));
      } else {
        // Create new pond
        await pondsService.createPond(formData);
        toast.success(t('common.success'));
      }

      // Reset form and close modal
      setFormData({
        farmId: farmIdFromUrl || '',
        name: '',
        description: '',
        area: 0,
        depth: 0,
        maxCapacity: 0,
        shape: 'rectangular',
        equipment: [],
        notes: '',
        managedById: '',
        status: 'active',
      });
      setEditingPond(null);
      setShowModal(false);
      loadPonds(); // Reload ponds after create/update
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(errorMessage);
      console.error('Error saving pond:', error);
    }
  };

  const handleEdit = (pond: Pond) => {
    setEditingPond(pond);
    setFormData({
      farmId: pond.farmId,
      name: pond.name,
      description: pond.description || '',
      area: pond.area,
      depth: pond.depth,
      maxCapacity: pond.maxCapacity,
      shape: pond.shape,
      equipment: pond.equipment || [],
      notes: pond.notes || '',
      managedById: pond.managedById,
      status: pond.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (pond: Pond) => {
    if (confirm(`هل أنت متأكد من حذف الحوض "${pond.name}"؟`)) {
      try {
        await pondsService.deletePond(pond.id);
        toast.success(t('common.success'));
        loadPonds(); // Reload ponds after deletion
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || t('common.error');
        toast.error(errorMessage);
        console.error('Error deleting pond:', error);
      }
    }
  };

  const openCreateModal = () => {
    setEditingPond(null);
    setFormData({
      farmId: farmIdFromUrl || '',
      name: '',
      description: '',
      area: 0,
      depth: 0,
      maxCapacity: 0,
      shape: 'rectangular',
      equipment: [],
      notes: '',
      managedById: '',
      status: 'active',
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الأحواض</h1>
        <p className="text-gray-600">إدارة أحواض الأسماك في مزارعك</p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Farm Filter */}
          <select
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="تصفية المزارع"
            title="اختر مزرعة لعرض أحواضها"
          >
            <option value="">جميع المزارع</option>
            {farms.map(farm => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="البحث في الأحواض..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="البحث في الأحواض"
            title="اكتب للبحث في أسماء الأحواض"
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="تصفية حالة الأحواض"
            title="اختر حالة الحوض للتصفية"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="maintenance">تحت الصيانة</option>
            <option value="under_construction">تحت الإنشاء</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          إضافة حوض جديد
        </button>
      </div>

      {/* Ponds Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      ) : filteredPonds.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-6xl mb-4">🏊‍♂️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أحواض</h3>
          <p className="text-gray-600 mb-4">ابدأ بإنشاء أول حوض في مزرعتك</p>
          <button
            onClick={openCreateModal}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إضافة حوض جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPonds.map(pond => (
            <div key={pond.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{pond.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[pond.status]}`}>
                  {statusLabels[pond.status]}
                </span>
              </div>

              {pond.farm && (
                <p className="text-sm text-gray-600 mb-3">المزرعة: {pond.farm.name}</p>
              )}

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {pond.area && (
                  <div className="flex justify-between">
                    <span>المساحة:</span>
                    <span>{pond.area} م²</span>
                  </div>
                )}
                {pond.depth && (
                  <div className="flex justify-between">
                    <span>العمق:</span>
                    <span>{pond.depth} م</span>
                  </div>
                )}
                {pond.volume && (
                  <div className="flex justify-between">
                    <span>الحجم:</span>
                    <span>{pond.volume} م³</span>
                  </div>
                )}
                {pond.maxCapacity && (
                  <div className="flex justify-between">
                    <span>السعة:</span>
                    <span>{pond.maxCapacity.toLocaleString()} سمكة</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(pond)}
                  className="flex-1 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(pond)}
                  className="flex-1 px-4 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPond ? 'تعديل الحوض' : 'إضافة حوض جديد'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="pond-farm" className="block text-sm font-medium text-gray-700 mb-1">
                  اختيار المزرعة *
                </label>
                <select
                  id="pond-farm"
                  required
                  value={formData.farmId}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  aria-describedby="pond-farm-help"
                  title="اختر المزرعة التي ينتمي إليها الحوض"
                >
                  <option value="">اختر المزرعة</option>
                  {farms.map(farm => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pond-name" className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الحوض *
                </label>
                <input
                  id="pond-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="مثال: حوض رقم 1"
                  aria-label="اسم الحوض"
                  title="أدخل اسم الحوض"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pond-area" className="block text-sm font-medium text-gray-700 mb-1">
                    المساحة (م²)
                  </label>
                  <input
                    id="pond-area"
                    type="number"
                    step="0.01"
                    value={formData.area || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value ? parseFloat(e.target.value) : 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="المساحة بالمتر المربع"
                    aria-label="مساحة الحوض"
                    title="أدخل مساحة الحوض بالمتر المربع"
                  />
                </div>

                <div>
                  <label htmlFor="pond-depth" className="block text-sm font-medium text-gray-700 mb-1">
                    العمق (م)
                  </label>
                  <input
                    id="pond-depth"
                    type="number"
                    step="0.01"
                    value={formData.depth || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, depth: e.target.value ? parseFloat(e.target.value) : 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="العمق بالمتر"
                    aria-label="عمق الحوض"
                    title="أدخل عمق الحوض بالمتر"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pond-volume" className="block text-sm font-medium text-gray-700 mb-1">
                    الحجم (م³)
                  </label>
                  <input
                    id="pond-volume"
                    type="number"
                    step="0.01"
                    value={formData.volume || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={formData.area && formData.depth ? `${formData.area * formData.depth}` : 'الحجم بالمتر المكعب'}
                    aria-label="حجم الحوض"
                    aria-describedby={formData.area && formData.depth ? 'pond-volume-hint' : undefined}
                    title="أدخل حجم الحوض بالمتر المكعب"
                  />
                  {formData.area && formData.depth && (
                    <p id="pond-volume-hint" className="text-xs text-gray-500 mt-1">
                      محسوب تلقائياً: {formData.area * formData.depth} م³
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="pond-capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    السعة (عدد الأسماك)
                  </label>
                  <input
                    id="pond-capacity"
                    type="number"
                    value={formData.maxCapacity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxCapacity: e.target.value ? parseInt(e.target.value) : 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="عدد الأسماك المتوقع"
                    aria-label="سعة الحوض"
                    title="أدخل العدد المتوقع من الأسماك"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pond-status" className="block text-sm font-medium text-gray-700 mb-1">
                  حالة الحوض
                </label>
                <select
                  id="pond-status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'maintenance' | 'cleaning' | 'under_construction' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  aria-label="حالة الحوض"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="maintenance">تحت الصيانة</option>
                  <option value="under_construction">تحت الإنشاء</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingPond ? 'حفظ التغييرات' : 'إنشاء الحوض'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}