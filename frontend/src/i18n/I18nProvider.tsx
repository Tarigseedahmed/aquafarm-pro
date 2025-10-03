'use client'

import { ReactNode, useEffect, useState } from 'react'
import i18next from 'i18next'
import { I18nextProvider } from 'react-i18next'

type Props = { children: ReactNode; locale: 'ar' | 'en' }

export default function I18nProvider({ children, locale }: Props) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initI18n = async () => {
      if (!i18next.isInitialized) {
        // Load translation files dynamically from public folder
        const [arTranslations, enTranslations] = await Promise.all([
          fetch('/locales/ar/common.json').then(res => res.json()),
          fetch('/locales/en/common.json').then(res => res.json())
        ])

        await i18next.init({
          lng: locale,
          fallbackLng: 'ar',
          interpolation: { escapeValue: false },
          resources: {
            ar: { common: arTranslations },
            en: { common: enTranslations }
          }
        })
      } else {
        await i18next.changeLanguage(locale)
      }
      setIsReady(true)
    }

    initI18n()
  }, [locale])

  if (!isReady) {
    return <div>Loading translations...</div>
  }

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
}


