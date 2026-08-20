import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from './locales/en.json'
import amTranslations from './locales/am.json'

// Get language safely with fallback
const getStoredLanguage = () => {
  try {
    return localStorage.getItem('language') || 'en'
  } catch (error) {
    console.warn('localStorage not available, using default language')
    return 'en'
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      am: { translation: amTranslations }
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })
  .catch((error) => {
    console.error('i18n initialization error:', error)
  })

export default i18n
