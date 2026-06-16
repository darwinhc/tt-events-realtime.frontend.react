import {useMemo} from 'react'

import type {AppUser, EventDetails, EventJoiner,} from '@/domains/events/types/event.types'
import {isEventCompleted} from '@/domains/events/utils/event-formatters'

export type EventFilter = 'all' | 'active' | 'joined'

interface UseEventFiltersOptions {
  events: EventDetails[]
  selectedId: number | null
  joinersByEvent: Record<number, EventJoiner[]>
  currentUser: AppUser | null
  eventFilter: EventFilter
  now: number
}

export function useEventFilters({
                                  events,
                                  selectedId,
                                  joinersByEvent,
                                  currentUser,
                                  eventFilter,
                                  now,
                                }: UseEventFiltersOptions) {
  const joinedEventIds = useMemo(() => {
    if (!currentUser) return new Set<number>()

    return new Set(
      Object.entries(joinersByEvent)
        .filter(([, eventJoiners]) =>
          eventJoiners.some(
            (joiner) => joiner.user_name === currentUser.name,
          ),
        )
        .map(([eventId]) => Number(eventId)),
    )
  }, [currentUser, joinersByEvent])

  const hasInactiveEvents = useMemo(
    () =>
      events.some(
        (event) =>
          event.status === 'canceled' || isEventCompleted(event, now),
      ),
    [events, now],
  )

  const activeOnly = eventFilter === 'active' && hasInactiveEvents
  const joinedOnly = eventFilter === 'joined' && currentUser !== null

  const visibleEvents = useMemo(() => {
    if (joinedOnly) {
      return events.filter((event) => joinedEventIds.has(event.id))
    }

    if (activeOnly) {
      return events.filter(
        (event) =>
          event.status !== 'canceled' && !isEventCompleted(event, now),
      )
    }

    return events
  }, [activeOnly, events, joinedEventIds, joinedOnly, now])

  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === selectedId) ?? null,
    [visibleEvents, selectedId],
  )

  const selectedJoiners = selectedId
    ? (joinersByEvent[selectedId] ?? [])
    : []

  return {
    joinedEventIds,
    hasInactiveEvents,
    activeOnly,
    joinedOnly,
    visibleEvents,
    selectedEvent,
    selectedJoiners,
  }
}