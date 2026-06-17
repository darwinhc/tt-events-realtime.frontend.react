import {describe, expect, it} from 'vitest'

import {getEventTimingStatus, getLocationDisplay, isEventCompleted,} from '@/domains/events/utils/event-formatters'
import {activeEvent} from '@/test/fixtures'

describe('event formatters', () => {

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
      isEventCompleted({...event, scheduled_at: null}, Date.now()),
    ).toBe(false)
    expect(
      getEventTimingStatus(
        {...event, scheduled_at: 'invalid'},
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
        location: {...activeEvent.location, name: null},
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
