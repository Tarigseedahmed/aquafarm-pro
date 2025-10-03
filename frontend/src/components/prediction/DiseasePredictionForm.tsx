'use client'

/**
 * AquaFarm Pro - Disease Prediction Form
 * Interactive form for disease prediction with AI recommendations
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Thermometer, 
  Droplets,
  Fish,
  Brain,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PredictionFormData {
  // Water Quality Parameters
  temperature: number
  ph: number
  dissolvedOxygen: number
  turbidity: number
  ammonia: number
  nitrite: number
  nitrate: number
  salinity: number
  conductivity: number
  
  // Fish Parameters
  fishWeight: number
  fishAge: number
  stockingDensity: number
  feedingRate: number
  waterChangeFrequency: number
  
  // Behavioral Parameters
  stressLevel: number
  swimmingBehavior: number
  feedingBehavior: number
  mortalityRate: number
  growthRate: number
}

interface PredictionResult {
  diseaseCategory: string
  confidence: number
  riskLevels: {
    bacterial: number
    fungal: number
    parasitic: number
    viral: number
  }
  overallRisk: number
  recommendations: string[]
  timestamp: string
}

interface DiseasePredictionFormProps {
  onPrediction?: (result: PredictionResult) => void
  className?: string
}

export default function DiseasePredictionForm({ 
  onPrediction, 
  className 
}: DiseasePredictionFormProps) {
  const { t } = useTranslation('common')
  const [formData, setFormData] = useState<PredictionFormData>({
    temperature: 25,
    ph: 7.0,
    dissolvedOxygen: 8.0,
    turbidity: 2.0,
    ammonia: 0.3,
    nitrite: 0.1,
    nitrate: 5.0,
    salinity: 0.5,
    conductivity: 500,
    fishWeight: 100,
    fishAge: 90,
    stockingDensity: 8,
    feedingRate: 3.0,
    waterChangeFrequency: 3,
    stressLevel: 0.3,
    swimmingBehavior: 0.7,
    feedingBehavior: 0.8,
    mortalityRate: 0.02,
    growthRate: 1.5
  })
  
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleInputChange = (field: keyof PredictionFormData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock prediction result
      const mockResult: PredictionResult = {
        diseaseCategory: 'bacterial',
        confidence: 0.85,
        riskLevels: {
          bacterial: 0.7,
          fungal: 0.3,
          parasitic: 0.4,
          viral: 0.2
        },
        overallRisk: 0.6,
        recommendations: [
          'تحسين جودة الماء - تقليل الأمونيا',
          'زيادة التهوية لتحسين الأكسجين المذاب',
          'مراقبة علامات الأمراض البكتيرية',
          'تنظيف الحوض وتقليل المواد العضوية'
        ],
        timestamp: new Date().toISOString()
      }
      
      setPrediction(mockResult)
      onPrediction?.(mockResult)
      
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في التنبؤ')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return 'text-green-600 bg-green-100'
    if (risk < 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRiskText = (risk: number) => {
    if (risk < 0.3) return 'منخفض'
    if (risk < 0.6) return 'متوسط'
    return 'عالي'
  }

  const getDiseaseColor = (category: string) => {
    const colors = {
      bacterial: 'text-red-600 bg-red-100',
      fungal: 'text-blue-600 bg-blue-100',
      parasitic: 'text-purple-600 bg-purple-100',
      viral: 'text-orange-600 bg-orange-100',
      healthy: 'text-green-600 bg-green-100'
    }
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getDiseaseText = (category: string) => {
    const texts = {
      bacterial: 'بكتيري',
      fungal: 'فطري',
      parasitic: 'طفيلي',
      viral: 'فيروسي',
      healthy: 'صحي'
    }
    return texts[category as keyof typeof texts] || category
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            تنبؤ الأمراض بالذكاء الاصطناعي
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Water Quality Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                معايير جودة المياه
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">درجة الحرارة (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ph">الأس الهيدروجيني</Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    value={formData.ph}
                    onChange={(e) => handleInputChange('ph', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dissolvedOxygen">الأكسجين المذاب (mg/L)</Label>
                  <Input
                    id="dissolvedOxygen"
                    type="number"
                    step="0.1"
                    value={formData.dissolvedOxygen}
                    onChange={(e) => handleInputChange('dissolvedOxygen', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="turbidity">العكارة (NTU)</Label>
                  <Input
                    id="turbidity"
                    type="number"
                    step="0.1"
                    value={formData.turbidity}
                    onChange={(e) => handleInputChange('turbidity', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ammonia">الأمونيا (mg/L)</Label>
                  <Input
                    id="ammonia"
                    type="number"
                    step="0.01"
                    value={formData.ammonia}
                    onChange={(e) => handleInputChange('ammonia', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nitrite">النيتريت (mg/L)</Label>
                  <Input
                    id="nitrite"
                    type="number"
                    step="0.01"
                    value={formData.nitrite}
                    onChange={(e) => handleInputChange('nitrite', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
              </div>
            </div>

            {/* Fish Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Fish className="w-4 h-4" />
                معايير الأسماك
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fishWeight">متوسط وزن السمكة (جم)</Label>
                  <Input
                    id="fishWeight"
                    type="number"
                    step="1"
                    value={formData.fishWeight}
                    onChange={(e) => handleInputChange('fishWeight', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fishAge">عمر السمكة (يوم)</Label>
                  <Input
                    id="fishAge"
                    type="number"
                    step="1"
                    value={formData.fishAge}
                    onChange={(e) => handleInputChange('fishAge', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stockingDensity">كثافة التربية (سمكة/م³)</Label>
                  <Input
                    id="stockingDensity"
                    type="number"
                    step="0.1"
                    value={formData.stockingDensity}
                    onChange={(e) => handleInputChange('stockingDensity', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="feedingRate">معدل التغذية (% من الوزن)</Label>
                  <Input
                    id="feedingRate"
                    type="number"
                    step="0.1"
                    value={formData.feedingRate}
                    onChange={(e) => handleInputChange('feedingRate', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="waterChangeFrequency">تكرار تغيير الماء (مرات/أسبوع)</Label>
                  <Input
                    id="waterChangeFrequency"
                    type="number"
                    step="1"
                    value={formData.waterChangeFrequency}
                    onChange={(e) => handleInputChange('waterChangeFrequency', parseFloat(e.target.value))}
                    className="text-right"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Parameters */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                {showAdvanced ? 'إخفاء المعايير المتقدمة' : 'إظهار المعايير المتقدمة'}
              </Button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      المعايير المتقدمة
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stressLevel">مستوى الإجهاد (0-1)</Label>
                        <Input
                          id="stressLevel"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={formData.stressLevel}
                          onChange={(e) => handleInputChange('stressLevel', parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="swimmingBehavior">سلوك السباحة (0-1)</Label>
                        <Input
                          id="swimmingBehavior"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={formData.swimmingBehavior}
                          onChange={(e) => handleInputChange('swimmingBehavior', parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="feedingBehavior">سلوك التغذية (0-1)</Label>
                        <Input
                          id="feedingBehavior"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={formData.feedingBehavior}
                          onChange={(e) => handleInputChange('feedingBehavior', parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mortalityRate">معدل الوفيات (0-1)</Label>
                        <Input
                          id="mortalityRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={formData.mortalityRate}
                          onChange={(e) => handleInputChange('mortalityRate', parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="growthRate">معدل النمو (0-3)</Label>
                        <Input
                          id="growthRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="3"
                          value={formData.growthRate}
                          onChange={(e) => handleInputChange('growthRate', parseFloat(e.target.value))}
                          className="text-right"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 ml-2 animate-spin" />
                  جاري التنبؤ...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 ml-2" />
                  تنبؤ الأمراض
                </>
              )}
            </Button>
          </form>

          {/* Error Display */}
          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Prediction Results */}
          {prediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    نتائج التنبؤ
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Disease Category */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">نوع المرض المتوقع:</span>
                    <Badge className={getDiseaseColor(prediction.diseaseCategory)}>
                      {getDiseaseText(prediction.diseaseCategory)}
                    </Badge>
                  </div>
                  
                  {/* Confidence */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">مستوى الثقة:</span>
                      <span className="text-sm text-gray-600">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={prediction.confidence * 100} className="h-2" />
                  </div>
                  
                  {/* Risk Levels */}
                  <div className="space-y-3">
                    <h4 className="font-medium">مستويات المخاطر:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(prediction.riskLevels).map(([type, risk]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{type}</span>
                          <Badge className={getRiskColor(risk)}>
                            {getRiskText(risk)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Overall Risk */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">المخاطر الإجمالية:</span>
                      <Badge className={getRiskColor(prediction.overallRisk)}>
                        {getRiskText(prediction.overallRisk)}
                      </Badge>
                    </div>
                    <Progress value={prediction.overallRisk * 100} className="h-2" />
                  </div>
                  
                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      التوصيات:
                    </h4>
                    <ul className="space-y-2">
                      {prediction.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
