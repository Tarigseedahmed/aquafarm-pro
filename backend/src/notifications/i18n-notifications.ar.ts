// Arabic localization constants for notifications (extracted from hard-coded strings)
// Keeping keys in snake_case for simplicity; can be refactored to a full i18n framework later.
export const NOTIFICATION_I18N_AR = {
  water_quality: {
    titles: {
      high_temperature: 'تحذير: درجة حرارة مرتفعة',
      low_dissolved_oxygen: 'تحذير: نقص الأكسجين المذاب',
      high_ammonia: 'تحذير: مستوى أمونيا مرتفع',
      ph_out_of_range: 'تحذير: مستوى الحموضة خارج النطاق المقبول',
      fallback: 'تنبيه جودة المياه',
    },
    messages: {
      high_temperature: (pondName: string, value: number) =>
        `درجة الحرارة في ${pondName} وصلت إلى ${value}°C`,
      low_dissolved_oxygen: (pondName: string, value: number) =>
        `مستوى الأكسجين المذاب في ${pondName} انخفض إلى ${value} mg/L`,
      high_ammonia: (pondName: string, value: number) =>
        `مستوى الأمونيا في ${pondName} ارتفع إلى ${value} mg/L`,
      ph_out_of_range: (pondName: string, value: number) =>
        `مستوى الحموضة في ${pondName} وصل إلى ${value}`,
      fallback: (parameter: string, pondName: string, value: number) =>
        `قيمة ${parameter} في ${pondName}: ${value}`,
    },
    actions: {
      view_pond: 'عرض تفاصيل الحوض',
      view_water_quality: 'عرض قراءات المياه',
    },
  },
  feeding: {
    title: 'تذكير التغذية',
    message: (batchNumber: string) => `حان وقت تغذية الدفعة ${batchNumber}`,
    action_record: 'تسجيل التغذية',
  },
  maintenance: {
    title: 'تنبيه صيانة',
    message: (equipmentName: string, maintenanceType: string) =>
      `${equipmentName} بحاجة إلى ${maintenanceType}`,
  },
  mock: {
    low_oxygen_title: 'تحذير: مستوى الأكسجين منخفض',
    feeding_reminder_title: 'تذكير التغذية',
    maintenance_alert_title: 'تنبيه صيانة',
    success_save_title: 'نجح حفظ القراءة',
  },
};

export type NotificationI18n = typeof NOTIFICATION_I18N_AR;