import type {EventDetails} from '@/domains/events/types/event.types.ts'

export interface EventCoordinatesResponse {
  latitude: number
  longitude: number
}

export interface EventLocationResponse {
  name: string | null
  address: string | null
  country: string | null
  city: string | null
  postal_code: string | null
  coordinates: EventCoordinatesResponse | null
  id: number
  created_at?: string | null
}

export interface EventDetailsResponse {
  id: number
  title: string
  organizer: string
  organizer_id: number
  duration_in_minutes: number
  location_id: number
  location: EventLocationResponse
  scheduled_at: string | null
  status: EventDetails['status']
  canceled_at: string | null
  deletion_scheduled_at: string | null
  joiners_count: number
}

export interface CreatedEventResponse {
  title: string
  organizer: string
  organizer_id: number | null
  duration_in_minutes: number
  location_id: number | null
  scheduled_at: string | null
  id: number | null
  status: 'active' | 'canceled'
  canceled_at: string | null
  deletion_scheduled_at: string | null
}

export interface EventJoinerResponse {
  id?: number | null
  user_id: number
  user_name: string
  event_id: number
  joined_at?: string | null
  left_at?: string | null
}

export interface EventJoinerInfoResponse {
  event_id: number
  user_id: number
  user_name: string
}
