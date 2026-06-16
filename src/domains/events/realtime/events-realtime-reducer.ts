import type {
  EventDetails,
  EventJoiner,
} from '@/domains/events/types/event.types'
import type { RealtimeNotification } from '@/domains/events/types/events-realtime.types'
import {
  isRecord,
  mergeEventPayload,
  parseJoiner,
} from '@/domains/events/utils/event-payload'

interface EventsRealtimeState {
  events: EventDetails[]
  joinersByEvent: Record<number, EventJoiner[]>
}

interface EventsRealtimeReduceResult extends EventsRealtimeState {
  handled: boolean
  joinersReloadEventId: number | null
}

function untouched(state: EventsRealtimeState): EventsRealtimeReduceResult {
  return {
    ...state,
    handled: false,
    joinersReloadEventId: null,
  }
}

function handled(
  state: EventsRealtimeState,
  joinersReloadEventId: number | null = null,
): EventsRealtimeReduceResult {
  return {
    ...state,
    handled: true,
    joinersReloadEventId,
  }
}

function applyJoinerNotification(
  state: EventsRealtimeState,
  notification: RealtimeNotification,
): EventsRealtimeReduceResult {
  if (
    !notification.type.startsWith('joiner.') ||
    typeof notification.event_id !== 'number'
  ) {
    return untouched(state)
  }

  const eventId = notification.event_id
  const payload = isRecord(notification.payload) ? notification.payload : null
  const count = payload?.joiners_count
  const changedJoiner = parseJoiner(payload?.joiner)

  const nextEvents =
    typeof count === 'number'
      ? state.events.map((event) =>
          event.id === eventId ? { ...event, joiners_count: count } : event,
        )
      : state.events

  if (!changedJoiner) {
    return handled(
      {
        ...state,
        events: nextEvents,
      },
      eventId,
    )
  }

  const eventJoiners = state.joinersByEvent[eventId] ?? []
  const nextEventJoiners =
    notification.type === 'joiner.joined'
      ? [
          ...eventJoiners.filter(
            (joiner) => joiner.user_id !== changedJoiner.user_id,
          ),
          changedJoiner,
        ]
      : eventJoiners.filter(
          (joiner) => joiner.user_id !== changedJoiner.user_id,
        )

  return handled({
    events: nextEvents,
    joinersByEvent: {
      ...state.joinersByEvent,
      [eventId]: nextEventJoiners,
    },
  })
}

function applyLocationNotification(
  state: EventsRealtimeState,
  notification: RealtimeNotification,
): EventsRealtimeReduceResult {
  if (
    notification.type !== 'location.updated' ||
    typeof notification.location_id !== 'number' ||
    !isRecord(notification.payload)
  ) {
    return untouched(state)
  }

  const locationId = notification.location_id
  const location = notification.payload

  return handled({
    ...state,
    events: state.events.map((event) =>
      event.location_id === locationId
        ? {
            ...event,
            location: {
              ...event.location,
              ...location,
              id: locationId,
            },
          }
        : event,
    ),
  })
}

function applyEventNotification(
  state: EventsRealtimeState,
  notification: RealtimeNotification,
): EventsRealtimeReduceResult {
  if (
    !notification.type.startsWith('event.') ||
    notification.type === 'event.created' ||
    typeof notification.event_id !== 'number' ||
    !isRecord(notification.payload)
  ) {
    return untouched(state)
  }

  const eventId = notification.event_id
  const payload = notification.payload

  return handled({
    ...state,
    events: state.events.map((event) =>
      event.id === eventId ? mergeEventPayload(event, payload) : event,
    ),
  })
}

export function applyRealtimeNotification(
  state: EventsRealtimeState,
  notification: RealtimeNotification,
): EventsRealtimeReduceResult {
  const joinerResult = applyJoinerNotification(state, notification)
  if (joinerResult.handled) return joinerResult

  const locationResult = applyLocationNotification(state, notification)
  if (locationResult.handled) return locationResult

  return applyEventNotification(state, notification)
}
