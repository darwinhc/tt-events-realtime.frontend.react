import type {EventDetails, EventJoiner,} from '@/domains/events/types/event.types.ts'

export interface EventsState {
  events: EventDetails[]
  selectedId: number | null
  joinersByEvent: Record<number, EventJoiner[]>
  loading: boolean
  error: string | null
  live: boolean
}

export const initialEventsState: EventsState = {
  events: [],
  selectedId: null,
  joinersByEvent: {},
  loading: true,
  error: null,
  live: false,
}
