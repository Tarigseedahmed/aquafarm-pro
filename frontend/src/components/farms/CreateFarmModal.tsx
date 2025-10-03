"use client"

import * as React from "react"
import { useState } from "react"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreateFarmModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function CreateFarmModal({ open, onClose, onSubmit }: CreateFarmModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    totalArea: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const farmData = {
      name: formData.name,
      location: formData.location || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      totalArea: formData.totalArea ? parseFloat(formData.totalArea) : undefined,
      description: formData.description || undefined
    }
    
    onSubmit(farmData)
    setFormData({
      name: '',
      location: '',
      latitude: '',
      longitude: '',
      totalArea: '',
      description: ''
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مزرعة جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المزرعة الجديدة لإضافتها إلى النظام
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">خط العرض</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
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
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
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
              value={formData.totalArea}
              onChange={(e) => handleInputChange('totalArea', e.target.value)}
              placeholder="5000"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="أدخل وصف المزرعة"
              rows={3}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button type="submit">
              <Plus className="w-4 h-4 ml-2" />
              إضافة المزرعة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}