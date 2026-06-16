import type {EventDetails} from '@/domains/events/types/event.types'
import {getCountryName} from '@/domains/events/data/countries'

export type EventTimingStatus = 'upcoming' | 'in-progress' | 'completed'

export function getEventTimingStatus(
  event: Pick<EventDetails, 'scheduled_at' | 'duration_in_minutes'>,
  now = Date.now(),
): EventTimingStatus {
  if (!event.scheduled_at) return 'upcoming'
  const start = new Date(event.scheduled_at).getTime()
  if (Number.isNaN(start) || now < start) return 'upcoming'

  const end = start + event.duration_in_minutes * 60_000
  return now < end ? 'in-progress' : 'completed'
}

export function isEventCompleted(
  event: Pick<EventDetails, 'scheduled_at' | 'duration_in_minutes'>,
  now = Date.now(),
) {
  return getEventTimingStatus(event, now) === 'completed'
}

function formatCity(value: string | null) {
  if (!value) return null
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function getLocationDisplay(event: EventDetails) {
  const {address, city, country, name, postal_code: postalCode} = event.location
  const countryName = getCountryName(country)
  const locality = [postalCode, formatCity(city)].filter(Boolean).join(' ')
  const region = [locality, countryName].filter(Boolean).join(', ')
  const venue = name || (address ? 'Event location' : 'Location to be defined')

  return {
    address,
    countryCode: country,
    countryName,
    region,
    venue,
  }
}
