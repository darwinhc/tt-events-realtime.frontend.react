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

export function formatEventDate(value: string | null) {
  if (!value) {
    return {month: 'TBD', day: '--', full: 'Date to be defined'}
  }

  const date = new Date(value)
  return {
    month: new Intl.DateTimeFormat('en', {month: 'short'}).format(date),
    day: new Intl.DateTimeFormat('en', {day: '2-digit'}).format(date),
    full: new Intl.DateTimeFormat('en', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date),
  }
}

export function formatEventTime(value: string | null) {
  if (!value) return 'Time to be defined'
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
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
