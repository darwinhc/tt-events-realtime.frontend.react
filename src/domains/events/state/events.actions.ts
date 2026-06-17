import type {EventDetails, EventJoiner,} from '@/domains/events/types/event.types.ts'
import type {EventsRealtimeDomainEvent} from '@/domains/events/realtime/events-realtime-domain-event'

export type EventsAction =
  | { type: 'eventsLoadStarted' }
  | {
  type: 'eventsLoaded'
  payload: {
    events: EventDetails[]
    preferredId?: number
  }
}
  | {
  type: 'eventsLoadFailed'
  payload: {
    error: string
  }
}
  | {
  type: 'selectedEventChanged'
  payload: {
    eventId: number | null
  }
}
  | {
  type: 'joinersLoaded'
  payload: {
    eventId: number
    joiners: EventJoiner[]
  }
}
  | {
  type: 'joinersBatchLoaded'
  payload: {
    joinersByEvent: Record<number, EventJoiner[]>
  }
}
  | { type: 'joinersCleared' }
  | { type: 'errorCleared' }
  | {
  type: 'eventJoinerAdded'
  payload: {
    eventId: number
    joiner: EventJoiner
  }
}
  | {
  type: 'eventJoinerRemoved'
  payload: {
    eventId: number
    userId?: number
    userName?: string
  }
}
  | {
  type: 'eventUpdated'
  payload: {
    event: EventDetails
  }
}
  | {
  type: 'operationFailed'
  payload: {
    error: string
  }
}
  | {
  type: 'liveChanged'
  payload: {
    live: boolean
  }
}
  | {
  type: 'realtimeDomainEventReceived'
  payload: {
    event: EventsRealtimeDomainEvent
  }
}
