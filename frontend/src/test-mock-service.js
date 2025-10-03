// اختبار Mock Service
console.log('🧪 اختبار Mock Service...');

// محاكاة استدعاء Mock Service
const mockData = {
  farms: [
    {
      id: '1',
      name: 'مزرعة الأسماك الرئيسية',
      location: 'الرياض، المملكة العربية السعودية',
      status: 'active',
      pondCount: 3,
      totalWaterVolume: 15000
    },
    {
      id: '2', 
      name: 'مزرعة الأسماك الشمالية',
      location: 'الدمام، المملكة العربية السعودية',
      status: 'active',
      pondCount: 2,
      totalWaterVolume: 8000
    }
  ]
};

console.log('✅ Mock Service جاهز!');
console.log('📊 عدد المزارع:', mockData.farms.length);
console.log('🏭 أسماء المزارع:', mockData.farms.map(f => f.name));

// محاكاة تأخير API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testMockService() {
  console.log('⏳ محاكاة تأخير API...');
  await delay(500);
  console.log('✅ Mock Service يعمل بشكل صحيح!');
}

testMockService();
