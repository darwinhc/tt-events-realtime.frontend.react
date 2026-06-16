import type {EventDetails, EventJoiner} from "@/domains/events/types/event.types.ts";

export interface RealtimeNotification {
  type: string
  event_id?: number
  location_id?: number
  payload?: unknown
}

export interface UseEventsRealtimeOptions {
  loadEvents: () => Promise<void>
  loadEventJoiners: (eventId: number) => Promise<void>
  setEvents: React.Dispatch<React.SetStateAction<EventDetails[]>>
  setJoinersByEvent: React.Dispatch<
    React.SetStateAction<Record<number, EventJoiner[]>>
  >
  setLive: React.Dispatch<React.SetStateAction<boolean>>
}