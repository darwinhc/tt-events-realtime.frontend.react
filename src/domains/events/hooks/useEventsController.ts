import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useEventFilters } from '@/domains/events/hooks/useEventFilters.ts'
import type { EventFilter } from '@/domains/events/hooks/useEventFilters.ts'
import { useEventsData } from '@/domains/events/hooks/useEventsData.ts'
import { useEventsRealtime } from '@/domains/events/hooks/useEventsRealtime'
import { useSessionUser } from '@/domains/events/hooks/useSessionUser.ts'
import type {
  CreateEventInput,
  EditEventInput,
} from '@/domains/events/types/event.types.ts'
import { eventsService } from '@/services/events/events.service.ts'

export function useEventsController() {
  const {
    events,
    setEvents,
    selectedId,
    setSelectedId,
    joinersByEvent,
    setJoinersByEvent,
    loading,
    error,
    setError,
    loadEvents,
    loadEventJoiners,
    loadMissingJoiners,
  } = useEventsData()

  const [busy, setBusy] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [now, setNow] = useState(Date.now)

  const { currentUser, createUser, resetSessionUser } = useSessionUser()
  const { t } = useTranslation()

  const {
    joinedEventIds,
    hasInactiveEvents,
    activeOnly,
    joinedOnly,
    visibleEvents,
    selectedEvent,
    selectedJoiners,
  } = useEventFilters({
    events,
    selectedId,
    joinersByEvent,
    currentUser,
    eventFilter,
    now,
  })

  const sidebarTitle = joinedOnly
    ? t('events.titles.joinedEvents')
    : activeOnly
      ? t('events.titles.activeEvents')
      : t('events.titles.allEvents')

  const emptyTitle = joinedOnly
    ? t('events.empty.joinedTitle')
    : activeOnly
      ? t('events.empty.activeTitle')
      : t('events.empty.defaultTitle')

  const emptyDescription = joinedOnly
    ? t('events.empty.joinedDescription')
    : activeOnly
      ? t('events.empty.activeDescription')
      : t('events.empty.defaultDescription')

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const requiredEventIds = currentUser
      ? events.map((event) => event.id)
      : selectedId
        ? [selectedId]
        : []

    const missingEventIds = requiredEventIds.filter(
      (eventId) => !(eventId in joinersByEvent),
    )

    if (missingEventIds.length === 0) return

    const timer = window.setTimeout(
      () => void loadMissingJoiners(missingEventIds),
      0,
    )

    return () => window.clearTimeout(timer)
  }, [
    currentUser,
    events,
    joinersByEvent,
    loadMissingJoiners,
    selectedId,
  ])

  useEffect(() => {
    if (
      visibleEvents.length > 0 &&
      !visibleEvents.some((event) => event.id === selectedId)
    ) {
      const timer = window.setTimeout(
        () => setSelectedId(visibleEvents[0].id),
        0,
      )
      return () => window.clearTimeout(timer)
    }
  }, [selectedId, setSelectedId, visibleEvents])

  useEventsRealtime({
    events,
    joinersByEvent,
    loadEvents,
    loadEventJoiners,
    setEvents,
    setJoinersByEvent,
    setLive,
  })

  function resetUser() {
    resetSessionUser()
    setJoinersByEvent({})
    setEventFilter('all')
    setCreateOpen(false)
    setEditOpen(false)
  }

  async function toggleJoin() {
    if (!selectedEvent || !currentUser) return

    setBusy(true)

    try {
      const joined = selectedJoiners.some(
        (joiner) => joiner.user_name === currentUser.name,
      )

      if (joined) {
        await eventsService.leave(selectedEvent.id, currentUser.name)

        setJoinersByEvent((current) => ({
          ...current,
          [selectedEvent.id]: selectedJoiners.filter(
            (joiner) => joiner.user_name !== currentUser.name,
          ),
        }))

        setEvents((current) =>
          current.map((event) =>
            event.id === selectedEvent.id
              ? {
                  ...event,
                  joiners_count: Math.max(0, event.joiners_count - 1),
                }
              : event,
          ),
        )
      } else {
        const joinedEvent = await eventsService.join(
          selectedEvent.id,
          currentUser.name,
        )

        setJoinersByEvent((current) => ({
          ...current,
          [selectedEvent.id]: selectedJoiners.some(
            (joiner) => joiner.user_name === currentUser.name,
          )
            ? selectedJoiners
            : [...selectedJoiners, joinedEvent],
        }))

        setEvents((current) =>
          current.map((event) =>
            event.id === selectedEvent.id
              ? { ...event, joiners_count: event.joiners_count + 1 }
              : event,
          ),
        )
      }
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : t('events.errors.updateEvent'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function cancelSelectedEvent() {
    if (!selectedEvent || !currentUser) return

    setBusy(true)

    try {
      await eventsService.cancel(selectedEvent.id, currentUser.name)
      await loadEvents()
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : t('events.errors.cancelEvent'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function restoreSelectedEvent() {
    if (!selectedEvent || !currentUser) return

    setBusy(true)

    try {
      await eventsService.uncancel(selectedEvent.id, currentUser.name)
      await loadEvents(selectedEvent.id)
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : t('events.errors.restoreEvent'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function createNewEvent(input: CreateEventInput) {
    setBusy(true)
    setCreateError(null)

    try {
      if (!currentUser) return

      const createdEvent = await eventsService.create(input, currentUser.name)
      await loadEvents(createdEvent.id ?? undefined)
      setCreateOpen(false)
    } catch (actionError) {
      setCreateError(
        actionError instanceof Error
          ? actionError.message
          : t('events.errors.createEvent'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function updateSelectedEvent(input: EditEventInput) {
    if (!selectedEvent || !currentUser) return

    setBusy(true)
    setEditError(null)

    try {
      await eventsService.updateLocation(
        selectedEvent.location_id,
        input.location,
        currentUser.name,
      )

      await eventsService.update(
        selectedEvent.id,
        input.event,
        currentUser.name,
      )

      await loadEvents(selectedEvent.id)
      setEditOpen(false)
    } catch (actionError) {
      setEditError(
        actionError instanceof Error
          ? actionError.message
          : t('events.errors.updateSelectedEvent'),
      )
    } finally {
      setBusy(false)
    }
  }

  return {
    activeOnly,
    busy,
    cancelSelectedEvent,
    createError,
    createNewEvent,
    createOpen,
    createUser,
    currentUser,
    editError,
    editOpen,
    emptyDescription,
    emptyTitle,
    error,
    eventFilter,
    events,
    hasInactiveEvents,
    joinedEventIds,
    joinedOnly,
    live,
    loadEvents,
    loading,
    now,
    resetUser,
    restoreSelectedEvent,
    selectedEvent,
    selectedId,
    selectedJoiners,
    setCreateError,
    setCreateOpen,
    setEditError,
    setEditOpen,
    setEventFilter,
    setSelectedId,
    sidebarTitle,
    toggleJoin,
    updateSelectedEvent,
    visibleEvents,
  }
}
