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


export function parseOptionalScheduledAt(
  dateValue: FormDataEntryValue | null,
  timeValue: FormDataEntryValue | null,
): Date | null {
  if (typeof dateValue !== 'string' || dateValue.trim() === '') {
    return null
  }

  const time =
    typeof timeValue === 'string' && timeValue.trim() !== ''
      ? timeValue
      : '00:00'

  const date = new Date(`${dateValue}T${time}`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export function toIsoStringOrNull(date: Date | null): string | null {
  return date === null ? null : date.toISOString()
}

export function toLocalDateTime(value: string | null | undefined): string {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offset = date.getTimezoneOffset() * 60_000

  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function toLocalDateInput(value: string | null | undefined): string {
  return toLocalDateTime(value).slice(0, 10)
}

export function toLocalTimeInput(value: string | null | undefined): string {
  return toLocalDateTime(value).slice(11, 16)
}
