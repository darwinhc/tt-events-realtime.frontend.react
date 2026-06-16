import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'

import {de} from '@/i18n/resources/de'
import {en} from '@/i18n/resources/en'
import {LANGUAGE_STORAGE_KEY} from "@/constants.ts";

const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
const browserLanguage = navigator.language.startsWith('de') ? 'de' : 'en'

void i18n.use(initReactI18next).init({
  resources: {
    en: {translation: en},
    de: {translation: de},
  },
  lng: savedLanguage || browserLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export {i18n}
