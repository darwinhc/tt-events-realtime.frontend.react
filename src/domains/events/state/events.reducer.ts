import type {EventsAction} from '@/domains/events/state/events.actions'
import type {EventsState} from '@/domains/events/state/events.state'
import type {EventsRealtimeDomainEvent} from '@/domains/events/realtime/events-realtime-domain-event'
import type {EventDetails, EventJoiner,} from '@/domains/events/types/event.types.ts'

function resolveSelectedId(
  events: EventDetails[],
  currentSelectedId: number | null,
  preferredId?: number,
): number | null {
  const requestedId = preferredId ?? currentSelectedId

  return events.some((event) => event.id === requestedId)
    ? requestedId
    : (events[0]?.id ?? null)
}

function hasSameJoiner(
  left: EventJoiner,
  right: EventJoiner,
): boolean {
  return left.user_id === right.user_id || left.user_name === right.user_name
}

function matchesJoiner(
  joiner: EventJoiner,
  userId?: number,
  userName?: string,
): boolean {
  return (
    (typeof userId === 'number' && joiner.user_id === userId) ||
    (typeof userName === 'string' && joiner.user_name === userName)
  )
}

function updateJoinersCount(
  events: EventDetails[],
  eventId: number,
  change: number,
): EventDetails[] {
  return events.map((event) =>
    event.id === eventId
      ? {
        ...event,
        joiners_count: Math.max(0, event.joiners_count + change),
      }
      : event,
  )
}

function patchEvent(
  events: EventDetails[],
  eventId: number,
  patch: Partial<EventDetails>,
): EventDetails[] {
  return events.map((event) =>
    event.id === eventId
      ? {
        ...event,
        ...patch,
      }
      : event,
  )
}

function setJoinersCount(
  events: EventDetails[],
  eventId: number,
  joinersCount: number | null,
): EventDetails[] {
  if (joinersCount === null) {
    return events
  }

  return events.map((event) =>
    event.id === eventId
      ? {
        ...event,
        joiners_count: joinersCount,
      }
      : event,
  )
}

function patchLocation(
  events: EventDetails[],
  locationId: number,
  location: Partial<EventDetails['location']>,
): EventDetails[] {
  return events.map((event) =>
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
  )
}

function applyRealtimeDomainEvent(
  state: EventsState,
  event: EventsRealtimeDomainEvent,
): EventsState {
  switch (event.type) {
    case 'event.created':
      return state

    case 'event.updated':
    case 'event.canceled':
    case 'event.uncanceled':
      return {
        ...state,
        events: patchEvent(state.events, event.eventId, event.patch),
      }

    case 'joiner.joined': {
      const currentJoiners = state.joinersByEvent[event.eventId] ?? []

      if (!event.joiner) {
        return {
          ...state,
          events: setJoinersCount(
            state.events,
            event.eventId,
            event.joinersCount,
          ),
        }
      }

      const exists = currentJoiners.some(
        (joiner) => joiner.user_id === event.joiner?.user_id,
      )

      return {
        ...state,
        events: setJoinersCount(
          state.events,
          event.eventId,
          event.joinersCount,
        ),
        joinersByEvent: {
          ...state.joinersByEvent,
          [event.eventId]: exists
            ? currentJoiners
            : [...currentJoiners, event.joiner],
        },
      }
    }

    case 'joiner.left': {
      const currentJoiners = state.joinersByEvent[event.eventId] ?? []

      return {
        ...state,
        events: setJoinersCount(
          state.events,
          event.eventId,
          event.joinersCount,
        ),
        joinersByEvent: {
          ...state.joinersByEvent,
          [event.eventId]: event.joiner
            ? currentJoiners.filter(
              (joiner) => joiner.user_id !== event.joiner?.user_id,
            )
            : currentJoiners,
        },
      }
    }

    case 'location.updated':
      return {
        ...state,
        events: patchLocation(
          state.events,
          event.locationId,
          event.location,
        ),
      }

    default:
      return state
  }
}

export function eventsReducer(
  state: EventsState,
  action: EventsAction,
): EventsState {
  switch (action.type) {
    case 'eventsLoadStarted':
      return {
        ...state,
        loading: true,
      }

    case 'eventsLoaded': {
      const {events, preferredId} = action.payload

      return {
        ...state,
        events,
        selectedId: resolveSelectedId(events, state.selectedId, preferredId),
        joinersByEvent: events.length === 0 ? {} : state.joinersByEvent,
        loading: false,
        error: null,
      }
    }

    case 'eventsLoadFailed':
      return {
        ...state,
        loading: false,
        error: action.payload.error,
      }

    case 'selectedEventChanged':
      return {
        ...state,
        selectedId: action.payload.eventId,
      }

    case 'joinersLoaded':
      return {
        ...state,
        joinersByEvent: {
          ...state.joinersByEvent,
          [action.payload.eventId]: action.payload.joiners,
        },
      }

    case 'joinersBatchLoaded':
      return {
        ...state,
        joinersByEvent: {
          ...state.joinersByEvent,
          ...action.payload.joinersByEvent,
        },
      }


    case 'joinersCleared':
      return {
        ...state,
        joinersByEvent: {},
      }

    case 'errorCleared':
      return {
        ...state,
        error: null,
      }

    case 'eventJoinerAdded': {
      const currentJoiners = state.joinersByEvent[action.payload.eventId] ?? []
      const exists = currentJoiners.some((joiner) =>
        hasSameJoiner(joiner, action.payload.joiner),
      )

      return {
        ...state,
        events: exists
          ? state.events
          : updateJoinersCount(state.events, action.payload.eventId, 1),
        joinersByEvent: {
          ...state.joinersByEvent,
          [action.payload.eventId]: exists
            ? currentJoiners
            : [...currentJoiners, action.payload.joiner],
        },
      }
    }

    case 'eventJoinerRemoved': {
      const currentJoiners = state.joinersByEvent[action.payload.eventId] ?? []
      const nextJoiners = currentJoiners.filter(
        (joiner) =>
          !matchesJoiner(
            joiner,
            action.payload.userId,
            action.payload.userName,
          ),
      )
      const removed = nextJoiners.length !== currentJoiners.length

      return {
        ...state,
        events: removed
          ? updateJoinersCount(state.events, action.payload.eventId, -1)
          : state.events,
        joinersByEvent: {
          ...state.joinersByEvent,
          [action.payload.eventId]: nextJoiners,
        },
      }
    }

    case 'eventUpdated':
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.event.id ? action.payload.event : event,
        ),
      }
    case 'operationFailed':
      return {
        ...state,
        error: action.payload.error,
      }

    case 'liveChanged':
      return {
        ...state,
        live: action.payload.live,
      }
    case 'realtimeDomainEventReceived':
      return applyRealtimeDomainEvent(state, action.payload.event)

    default:
      return state
  }
}

