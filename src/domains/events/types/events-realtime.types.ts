import type {Dispatch} from 'react'

import type {EventsAction} from '@/domains/events/state/events.actions.ts'

export interface UseEventsRealtimeOptions {
  loadEvents: () => Promise<void>
  loadEventJoiners: (eventId: number) => Promise<void>
  dispatch: Dispatch<EventsAction>
}
