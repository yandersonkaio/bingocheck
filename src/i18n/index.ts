import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import es from './locales/es.json'
import it from './locales/it.json'
import ptBR from './locales/pt-BR.json'

const supportedLanguages = ['pt-BR', 'en', 'es', 'it']

const savedLanguage = localStorage.getItem('bingocheck:language')

const initialLanguage =
  savedLanguage && supportedLanguages.includes(savedLanguage)
    ? savedLanguage
    : 'pt-BR'

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
    it: { translation: it },
  },
  lng: initialLanguage,
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
