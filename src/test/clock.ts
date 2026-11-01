import {afterEach, beforeEach, vi} from 'vitest'

/** The "today" the fixtures in this folder are written against. */
export const FIXTURE_NOW = new Date('2026-06-14T12:00:00Z')

/**
 * Pins Date (only Date, so timers and user-event keep running in real time)
 * to FIXTURE_NOW, so date validations do not depend on the day the suite runs.
 */
export function useFixtureClock(): void {
  beforeEach(() => {
    vi.useFakeTimers({toFake: ['Date']})
    vi.setSystemTime(FIXTURE_NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })
}
