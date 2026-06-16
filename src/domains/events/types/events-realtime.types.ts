import type { Dispatch, SetStateAction } from 'react'

import type {
  EventDetails,
  EventJoiner,
} from '@/domains/events/types/event.types'

export interface RealtimeNotification {
  type: string
  event_id?: number
  location_id?: number
  payload?: unknown
}

export interface UseEventsRealtimeOptions {
  events: EventDetails[]
  joinersByEvent: Record<number, EventJoiner[]>
  loadEvents: () => Promise<void>
  loadEventJoiners: (eventId: number) => Promise<void>
  setEvents: Dispatch<SetStateAction<EventDetails[]>>
  setJoinersByEvent: Dispatch<
    SetStateAction<Record<number, EventJoiner[]>>
  >
  setLive: Dispatch<SetStateAction<boolean>>
}
