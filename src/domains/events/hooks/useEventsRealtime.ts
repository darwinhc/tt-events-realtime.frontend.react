import { useEffect, useRef } from 'react'

import { EventsRealtimeClient } from '@/domains/events/realtime/events-realtime-client'
import { parseRealtimeNotification } from '@/domains/events/realtime/events-realtime-message'
import { applyRealtimeNotification } from '@/domains/events/realtime/events-realtime-reducer'
import type { UseEventsRealtimeOptions } from '@/domains/events/types/events-realtime.types.ts'
import { eventsService } from '@/services/events/events.service.ts'

export function useEventsRealtime({
  events,
  joinersByEvent,
  loadEvents,
  loadEventJoiners,
  setEvents,
  setJoinersByEvent,
  setLive,
}: UseEventsRealtimeOptions) {
  const eventsRef = useRef(events)
  const joinersByEventRef = useRef(joinersByEvent)

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  useEffect(() => {
    joinersByEventRef.current = joinersByEvent
  }, [joinersByEvent])

  useEffect(() => {
    const client = new EventsRealtimeClient({
      getUrl: eventsService.getWebSocketUrl,
      onOpen: ({ shouldRefresh }) => {
        setLive(true)

        if (shouldRefresh) {
          void loadEvents()
        }
      },
      onClose: () => {
        setLive(false)
      },
      onMessage: (message) => {
        const notification = parseRealtimeNotification(message)

        if (!notification) {
          void loadEvents()
          return
        }

        const result = applyRealtimeNotification(
          {
            events: eventsRef.current,
            joinersByEvent: joinersByEventRef.current,
          },
          notification,
        )

        if (!result.handled) {
          void loadEvents()
          return
        }

        eventsRef.current = result.events
        joinersByEventRef.current = result.joinersByEvent
        setEvents(result.events)
        setJoinersByEvent(result.joinersByEvent)

        if (result.joinersReloadEventId !== null) {
          void loadEventJoiners(result.joinersReloadEventId)
        }
      },
    })

    client.start()

    return () => {
      client.stop()
    }
  }, [
    loadEventJoiners,
    loadEvents,
    setEvents,
    setJoinersByEvent,
    setLive,
  ])
}
