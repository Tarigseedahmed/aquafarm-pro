import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-aqua-50 to-primary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            مرحباً بك في AquaFarm Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            منصة سحابية متعددة المستأجرين لإدارة ومحاسبة مزارع الأسماك
          </p>
          <div className="space-x-4 rtl:space-x-reverse">
            <Link
              href="/login"
              className="bg-aqua-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-aqua-700 transition-colors"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/dashboard"
              className="bg-white text-aqua-600 px-8 py-3 rounded-lg font-medium border border-aqua-600 hover:bg-aqua-50 transition-colors"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-4">🐟</div>
            <h3 className="text-xl font-semibold mb-2">إدارة الأحواض</h3>
            <p className="text-gray-600">تتبع وإدارة أحواض الأسماك والدورات الإنتاجية</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">النظام المحاسبي</h3>
            <p className="text-gray-600">نظام محاسبي متكامل متوافق مع المعايير الدولية</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">التقارير والتحليلات</h3>
            <p className="text-gray-600">تقارير شاملة وتحليلات ذكية لأداء المزرعة</p>
          </div>
        </div>
      </div>
    </main>
  )
}
