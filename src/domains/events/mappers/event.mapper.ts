import type {
  CreatedEventResponse,
  EventDetailsResponse,
  EventJoinerInfoResponse,
  EventJoinerResponse,
  EventLocationResponse,
} from '@/domains/events/api/events-api.types.ts'
import type {CreatedEvent, EventDetails, EventJoiner, EventLocation,} from '@/domains/events/types/event.types.ts'

export function mapEventLocationResponse(
  response: EventLocationResponse,
): EventLocation {
  return {
    id: response.id,
    name: response.name,
    address: response.address,
    country: response.country,
    city: response.city,
    postal_code: response.postal_code,
    coordinates: response.coordinates,
  }
}

export function mapEventDetailsResponse(
  response: EventDetailsResponse,
): EventDetails {
  return {
    id: response.id,
    title: response.title,
    organizer: response.organizer,
    organizer_id: response.organizer_id,
    duration_in_minutes: response.duration_in_minutes,
    location_id: response.location_id,
    location: mapEventLocationResponse(response.location),
    scheduled_at: response.scheduled_at,
    status: response.status,
    canceled_at: response.canceled_at,
    deletion_scheduled_at: response.deletion_scheduled_at,
    joiners_count: response.joiners_count,
  }
}

export function mapEventDetailsResponses(
  responses: EventDetailsResponse[],
): EventDetails[] {
  return responses.map(mapEventDetailsResponse)
}

export function mapCreatedEventResponse(
  response: CreatedEventResponse,
): CreatedEvent {
  return {
    id: response.id,
    title: response.title,
    organizer: response.organizer,
    organizer_id: response.organizer_id,
    duration_in_minutes: response.duration_in_minutes,
    location_id: response.location_id,
    scheduled_at: response.scheduled_at,
    status: response.status,
    canceled_at: response.canceled_at,
    deletion_scheduled_at: response.deletion_scheduled_at,
  }
}

export function mapEventJoinerResponse(
  response: EventJoinerResponse,
): EventJoiner {
  return {
    id: response.id ?? null,
    user_id: response.user_id,
    user_name: response.user_name,
    event_id: response.event_id,
    left_at: response.left_at ?? null,
  }
}

export function mapEventJoinerResponses(
  responses: EventJoinerResponse[],
): EventJoiner[] {
  return responses.map(mapEventJoinerResponse)
}

export function mapEventJoinerInfoResponse(
  response: EventJoinerInfoResponse,
): EventJoiner {
  return {
    id: null,
    user_id: response.user_id,
    user_name: response.user_name,
    event_id: response.event_id,
    left_at: null,
  }
}

export function mapEventJoinerInfoResponses(
  responses: EventJoinerInfoResponse[],
): EventJoiner[] {
  return responses.map(mapEventJoinerInfoResponse)
}

export function groupJoinersByEventId(
  eventIds: number[],
  joiners: EventJoiner[],
): Record<number, EventJoiner[]> {
  const joinersByEvent: Record<number, EventJoiner[]> = Object.fromEntries(
    eventIds.map((eventId) => [eventId, [] as EventJoiner[]]),
  )

  joiners.forEach((joiner) => {
    joinersByEvent[joiner.event_id] ??= []
    joinersByEvent[joiner.event_id].push(joiner)
  })

  return joinersByEvent
}
