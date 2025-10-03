/**
 * إعدادات التطوير
 * استخدام Mock Service في مرحلة التطوير
 */

export const DEVELOPMENT_CONFIG = {
  // استخدام Mock Service بدلاً من API الحقيقي
  USE_MOCK_SERVICE: true,
  
  // إعدادات API
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  
  // إعدادات Mock Service
  MOCK_DELAY: 500, // تأخير محاكاة API بالمللي ثانية
  
  // إعدادات التطوير
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  
  // إعدادات الشبكة
  NETWORK_TIMEOUT: 10000,
  
  // إعدادات اللغة
  DEFAULT_LOCALE: 'ar',
  SUPPORTED_LOCALES: ['ar', 'en'],
  
  // إعدادات التصميم
  RTL_SUPPORT: true,
  THEME: 'light', // 'light' | 'dark'
  
  // إعدادات البيانات الوهمية
  MOCK_DATA: {
    FARMS_COUNT: 2,
    PONDS_PER_FARM: 3,
    FISH_PER_POND: 1000,
    WATER_QUALITY_READINGS: 150
  }
}

export default DEVELOPMENT_CONFIG
