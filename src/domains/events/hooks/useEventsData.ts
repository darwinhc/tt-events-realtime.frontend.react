import {useCallback, useEffect, useReducer, useRef} from 'react'

import {eventsService} from '@/domains/events/services/events.service.ts'
import {eventsReducer} from '@/domains/events/state/events.reducer'
import {initialEventsState} from '@/domains/events/state/events.state'
import type {EventDetails} from '@/domains/events/types/event.types'
import {groupJoinersByEvent} from '@/domains/events/utils/event-payload.ts'

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function useEventsData() {
  const eventsRequestRef = useRef<Promise<EventDetails[]> | null>(null)
  const [state, dispatch] = useReducer(eventsReducer, initialEventsState)

  const loadEvents = useCallback(async (preferredId?: number) => {
    dispatch({type: 'eventsLoadStarted'})

    try {
      if (!eventsRequestRef.current) {
        eventsRequestRef.current = eventsService.getEvents().finally(() => {
          eventsRequestRef.current = null
        })
      }

      const events = await eventsRequestRef.current

      dispatch({
        type: 'eventsLoaded',
        payload: {
          events,
          preferredId,
        },
      })
    } catch (loadError) {
      dispatch({
        type: 'eventsLoadFailed',
        payload: {
          error: getErrorMessage(loadError, 'Could not load events.'),
        },
      })
    }
  }, [])

  const loadEventJoiners = useCallback(async (eventId: number) => {
    try {
      const joiners = await eventsService.getJoiners(eventId)

      dispatch({
        type: 'joinersLoaded',
        payload: {
          eventId,
          joiners,
        },
      })
    } catch {
      dispatch({
        type: 'joinersLoaded',
        payload: {
          eventId,
          joiners: [],
        },
      })
    }
  }, [])

  const loadMissingJoiners = useCallback(async (eventIds: number[]) => {
    if (eventIds.length === 0) {
      return
    }

    const uniqueEventIds = Array.from(new Set(eventIds))

    try {
      const joiners = await eventsService.getJoinersForEvents(uniqueEventIds)
      const joinersByEvent = groupJoinersByEvent(uniqueEventIds, joiners)

      dispatch({
        type: 'joinersBatchLoaded',
        payload: {
          joinersByEvent,
        },
      })
    } catch (loadError) {
      dispatch({
        type: 'operationFailed',
        payload: {
          error: getErrorMessage(loadError, 'Could not load event joiners.'),
        },
      })
    }
  }, [])

  const setSelectedId = useCallback((eventId: number | null) => {
    dispatch({
      type: 'selectedEventChanged',
      payload: {
        eventId,
      },
    })
  }, [])

  const setError = useCallback((error: string | null) => {
    if (error === null) {
      dispatch({type: 'errorCleared'})
      return
    }

    dispatch({
      type: 'operationFailed',
      payload: {
        error,
      },
    })
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvents(), 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadEvents])

  return {
    events: state.events,
    selectedId: state.selectedId,
    joinersByEvent: state.joinersByEvent,
    loading: state.loading,
    error: state.error,
    live: state.live,
    dispatch,
    setSelectedId,
    setError,
    loadEvents,
    loadEventJoiners,
    loadMissingJoiners,
  }
}
