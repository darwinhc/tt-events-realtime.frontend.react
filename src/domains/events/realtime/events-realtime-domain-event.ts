import type {EventDetails, EventJoiner, EventLocation,} from '@/domains/events/types/event.types'

export type EventRealtimePatch = Partial<
  Pick<
    EventDetails,
    | 'title'
    | 'organizer'
    | 'organizer_id'
    | 'duration_in_minutes'
    | 'location_id'
    | 'scheduled_at'
    | 'status'
    | 'canceled_at'
    | 'deletion_scheduled_at'
  >
>

export type LocationRealtimePatch = Partial<
  Pick<
    EventLocation,
    | 'name'
    | 'address'
    | 'country'
    | 'city'
    | 'postal_code'
    | 'coordinates'
  >
> & {
  id: number
}

export type EventsRealtimeDomainEvent =
  | {
  type: 'event.created'
  eventId: number
}
  | {
  type: 'event.updated'
  eventId: number
  patch: EventRealtimePatch
}
  | {
  type: 'event.canceled'
  eventId: number
  patch: EventRealtimePatch
}
  | {
  type: 'event.uncanceled'
  eventId: number
  patch: EventRealtimePatch
}
  | {
  type: 'joiner.joined'
  eventId: number
  joiner: EventJoiner | null
  joinersCount: number | null
}
  | {
  type: 'joiner.left'
  eventId: number
  joiner: EventJoiner | null
  joinersCount: number | null
}
  | {
  type: 'location.updated'
  locationId: number
  location: LocationRealtimePatch
}