import { describe, expect, it } from 'vitest'

import {
  formatDuration,
  formatEventDate,
  formatEventTime,
  getEventTimingStatus,
  getLocationDisplay,
  isEventCompleted,
} from '@/domains/events/utils/event-formatters'
import { activeEvent } from '@/test/fixtures'

describe('event formatters', () => {
  it('formats scheduled dates and undefined dates', () => {
    expect(formatEventDate(null)).toEqual({
      month: 'TBD',
      day: '--',
      full: 'Date to be defined',
    })
    expect(formatEventDate('2026-07-09T16:30:00Z')).toMatchObject({
      month: 'Jul',
      day: '09',
    })
  })

  it('formats time and duration variants', () => {
    expect(formatEventTime(null)).toBe('Time to be defined')
    expect(formatEventTime('2026-07-09T16:30:00Z')).toMatch(/6:30 PM|4:30 PM/)
    expect(formatDuration(1)).toBe('1 minute')
    expect(formatDuration(45)).toBe('45 minutes')
    expect(formatDuration(60)).toBe('1 hour')
    expect(formatDuration(120)).toBe('2 hours')
    expect(formatDuration(90)).toBe('1h 30m')
  })

  it('distinguishes upcoming, in-progress, and completed event times', () => {
    const event = {
      scheduled_at: '2026-06-14T10:00:00Z',
      duration_in_minutes: 120,
    }
    expect(
      getEventTimingStatus(event, new Date('2026-06-14T09:59:59Z').getTime()),
    ).toBe('upcoming')
    expect(
      getEventTimingStatus(event, new Date('2026-06-14T10:00:00Z').getTime()),
    ).toBe('in-progress')
    expect(
      getEventTimingStatus(event, new Date('2026-06-14T11:59:59Z').getTime()),
    ).toBe('in-progress')
    expect(
      getEventTimingStatus(event, new Date('2026-06-14T12:00:00Z').getTime()),
    ).toBe('completed')
    expect(
      isEventCompleted(event, new Date('2026-06-14T11:59:59Z').getTime()),
    ).toBe(false)
    expect(
      isEventCompleted(event, new Date('2026-06-14T12:00:00Z').getTime()),
    ).toBe(true)
    expect(
      isEventCompleted({ ...event, scheduled_at: null }, Date.now()),
    ).toBe(false)
    expect(
      getEventTimingStatus(
        { ...event, scheduled_at: 'invalid' },
        Date.now(),
      ),
    ).toBe('upcoming')
  })

  it('separates venue, address and geographic context', () => {
    expect(getLocationDisplay(activeEvent)).toEqual({
      venue: 'Factory Berlin',
      address: 'Lohmühlenstraße 65',
      region: '12435 Berlin, Germany',
      countryCode: 'DE',
      countryName: 'Germany',
    })
    expect(
      getLocationDisplay({
        ...activeEvent,
        location: { ...activeEvent.location, name: null },
      }),
    ).toMatchObject({
      venue: 'Event location',
      address: 'Lohmühlenstraße 65',
    })
    expect(
      getLocationDisplay({
        ...activeEvent,
        location: {
          ...activeEvent.location,
          name: null,
          address: null,
          city: null,
          country: null,
          postal_code: null,
        },
      }),
    ).toMatchObject({
      venue: 'Location to be defined',
      address: null,
      region: '',
    })
  })
})
