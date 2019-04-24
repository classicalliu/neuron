import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from 'locales/zh'
import en from 'locales/en'

i18n.use(initReactI18next).init({
  resources: {
    en,
    zh,
  },
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
