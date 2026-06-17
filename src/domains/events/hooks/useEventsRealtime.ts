import {useEffect} from 'react'

import {EventsRealtimeClient} from '@/domains/events/realtime/events-realtime-client'
import {eventsService} from '@/domains/events/services/events.service'
import type {UseEventsRealtimeOptions} from '@/domains/events/types/events-realtime.types'

export function useEventsRealtime({
                                    loadEvents,
                                    loadEventJoiners,
                                    dispatch,
                                  }: UseEventsRealtimeOptions) {
  useEffect(() => {
    const client = new EventsRealtimeClient({
      getUrl: eventsService.getWebSocketUrl,

      onOpen: ({shouldRefresh}) => {
        dispatch({
          type: 'liveChanged',
          payload: {
            live: true,
          },
        })

        if (shouldRefresh) {
          void loadEvents()
        }
      },

      onClose: () => {
        dispatch({
          type: 'liveChanged',
          payload: {
            live: false,
          },
        })
      },

      onInvalidMessage: () => {
        // ignore
      },

      onDomainEvent: (event) => {
        dispatch({
          type: 'realtimeDomainEventReceived',
          payload: {
            event,
          },
        })

        if (event.type === 'event.created') {
          void loadEvents()
          return
        }

        if (
          (event.type === 'joiner.joined' || event.type === 'joiner.left') &&
          event.joiner === null
        ) {
          void loadEventJoiners(event.eventId)
        }
      },
    })

    client.start()

    return () => {
      client.stop()
    }
  }, [dispatch, loadEventJoiners, loadEvents])
}