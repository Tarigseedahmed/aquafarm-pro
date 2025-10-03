// API Base URL
const API_URL = 'http://localhost:3000/api';

// تحميل المزارع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadFarms();
    checkServerHealth();
});

// التحقق من صحة الخادم
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('✅ Server Status:', data);
    } catch (error) {
        console.error('❌ Server is not responding:', error);
    }
}

// تحميل المزارع
async function loadFarms() {
    try {
        const response = await fetch(`${API_URL}/farms`);
        const data = await response.json();
        
        if (data.success) {
            displayFarms(data.data);
        }
    } catch (error) {
        console.error('Error loading farms:', error);
        displayError('فشل في تحميل المزارع');
    }
}

// عرض المزارع
function displayFarms(farms) {
    const farmsList = document.getElementById('farms-list');
    
    if (farms.length === 0) {
        farmsList.innerHTML = `
            <div class="card">
                <p>لا توجد مزارع مسجلة حالياً</p>
                <button class="btn-primary" onclick="showAddFarmForm()">إضافة مزرعة جديدة</button>
            </div>
        `;
        return;
    }

    farmsList.innerHTML = farms.map(farm => `
        <div class="card">
            <h3>${farm.name}</h3>
            <p><strong>الموقع:</strong> ${farm.location}</p>
            <p><strong>المساحة:</strong> ${farm.area} متر مربع</p>
            <p><strong>تاريخ الإنشاء:</strong> ${new Date(farm.created_at).toLocaleDateString('ar-SA')}</p>
        </div>
    `).join('');
}

// عرض رسالة خطأ
function displayError(message) {
    const farmsList = document.getElementById('farms-list');
    farmsList.innerHTML = `
        <div class="card error">
            <p>❌ ${message}</p>
        </div>
    `;
}

// عرض نموذج إضافة مزرعة
function showAddFarmForm() {
    alert('سيتم إضافة نموذج إنشاء مزرعة جديدة قريباً!');
}

// تحديث البيانات كل 30 ثانية
setInterval(() => {
    loadFarms();
}, 30000);
