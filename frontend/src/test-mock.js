// اختبار سريع لـ Mock Service
const { mockFarmService } = require('./services/mock.service.ts');

async function testMockService() {
  try {
    console.log('اختبار Mock Service...');
    
    const farms = await mockFarmService.getAllFarms();
    console.log('عدد المزارع:', farms.length);
    console.log('أول مزرعة:', farms[0]?.name);
    
    const searchResults = await mockFarmService.searchFarms('الرئيسية');
    console.log('نتائج البحث:', searchResults.length);
    
    console.log('✅ Mock Service يعمل بشكل صحيح!');
  } catch (error) {
    console.error('❌ خطأ في Mock Service:', error);
  }
}

testMockService();
