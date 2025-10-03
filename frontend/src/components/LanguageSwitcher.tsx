'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [locale, setLocale] = useState<'ar' | 'en'>('ar')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale') as 'ar' | 'en' | null
      if (stored === 'ar' || stored === 'en') {
        setLocale(stored)
        i18n.changeLanguage(stored)
      }
    } catch {}
  }, [i18n])

  const toggle = () => {
    const next = locale === 'ar' ? 'en' : 'ar'
    setLocale(next)
    i18n.changeLanguage(next)
    try {
      localStorage.setItem('locale', next)
    } catch {}
    // Adjust document attributes immediately for better UX
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', next)
      document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr')
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      title={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      {locale === 'ar' ? 'EN' : 'AR'}
    </button>
  )
}


