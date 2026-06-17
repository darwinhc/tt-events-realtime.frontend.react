import '@testing-library/jest-dom/vitest'
import {i18n} from '@/i18n'
import {cleanup} from '@testing-library/react'
import {afterEach, beforeEach, vi} from 'vitest'

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  window.localStorage.clear()
  window.sessionStorage.clear()
})
