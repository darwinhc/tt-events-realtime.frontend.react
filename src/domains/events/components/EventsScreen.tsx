import {CalendarDays, LoaderCircle, LogOut, Plus, Radio, RefreshCw, Users,} from 'lucide-react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button} from '@/components/ui/button'
import {CreateEventDialog} from '@/domains/events/components/CreateEventDialog'
import {EditEventDialog} from '@/domains/events/components/EditEventDialog'
import {EventDetail} from '@/domains/events/components/EventDetail'
import {EventList} from '@/domains/events/components/EventList'
import {WelcomeScreen} from '@/domains/events/components/WelcomeScreen'
import type {
  AppUser,
  CreateEventInput,
  EditEventInput,
  EventDetails,
  EventJoiner,
} from '@/domains/events/types/event.types'
import {isEventCompleted} from '@/domains/events/utils/event-formatters'
import {eventsService} from '@/services/events/events.service'

const USER_SESSION_KEY = 'events.current-user.v1'
type EventFilter = 'all' | 'active' | 'joined'

interface RealtimeNotification {
  type: string
  event_id?: number
  location_id?: number
  payload?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function mergeEventPayload(
  event: EventDetails,
  payload: Record<string, unknown>,
): EventDetails {
  return {
    ...event,
    title: typeof payload.title === 'string' ? payload.title : event.title,
    duration_in_minutes:
      typeof payload.duration_in_minutes === 'number'
        ? payload.duration_in_minutes
        : event.duration_in_minutes,
    scheduled_at:
      typeof payload.scheduled_at === 'string' ||
      payload.scheduled_at === null
        ? payload.scheduled_at
        : event.scheduled_at,
    status:
      payload.status === 'active' || payload.status === 'canceled'
        ? payload.status
        : event.status,
    canceled_at:
      typeof payload.canceled_at === 'string' || payload.canceled_at === null
        ? payload.canceled_at
        : event.canceled_at,
    deletion_scheduled_at:
      typeof payload.deletion_scheduled_at === 'string' ||
      payload.deletion_scheduled_at === null
        ? payload.deletion_scheduled_at
        : event.deletion_scheduled_at,
  }
}

function parseJoiner(value: unknown): EventJoiner | null {
  if (
    !isRecord(value) ||
    typeof value.user_id !== 'number' ||
    typeof value.user_name !== 'string' ||
    typeof value.event_id !== 'number'
  ) {
    return null
  }
  return {
    id: typeof value.id === 'number' ? value.id : null,
    user_id: value.user_id,
    user_name: value.user_name,
    event_id: value.event_id,
    left_at: typeof value.left_at === 'string' ? value.left_at : null,
  }
}

function createAppUser(name: string): AppUser {
  const normalizedName = name.trim().replace(/\s+/g, ' ')
  const initials = normalizedName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return { id: null, name: normalizedName, initials }
}

function removeSessionUser() {
  try {
    window.sessionStorage.removeItem(USER_SESSION_KEY)
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function getSessionUser(): AppUser | null {
  try {
    const value = window.sessionStorage.getItem(USER_SESSION_KEY)
    if (!value) return null

    const storedUser: unknown = JSON.parse(value)
    if (
      !storedUser ||
      typeof storedUser !== 'object' ||
      !('name' in storedUser) ||
      typeof storedUser.name !== 'string' ||
      !storedUser.name.trim()
    ) {
      removeSessionUser()
      return null
    }

    return createAppUser(storedUser.name)
  } catch {
    removeSessionUser()
    return null
  }
}

function storeSessionUser(name: string) {
  try {
    window.sessionStorage.setItem(
      USER_SESSION_KEY,
      JSON.stringify({ name }),
    )
  } catch {
    // The in-memory user remains usable when storage is unavailable.
  }
}

export function EventsScreen() {
  const eventsRequestRef = useRef<Promise<EventDetails[]> | null>(null)
  const [events, setEvents] = useState<EventDetails[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [joinersByEvent, setJoinersByEvent] = useState<
    Record<number, EventJoiner[]>
  >({})
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getSessionUser)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [now, setNow] = useState(Date.now)

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

  const visibleEvents = useMemo(
    () => {
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
    },
    [activeOnly, events, joinedEventIds, joinedOnly, now],
  )

  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === selectedId) ?? null,
    [visibleEvents, selectedId],
  )
  const selectedJoiners = selectedId
    ? (joinersByEvent[selectedId] ?? [])
    : []

  const loadEvents = useCallback(async (preferredId?: number) => {
    try {
      if (!eventsRequestRef.current) {
        eventsRequestRef.current = eventsService.getEvents().finally(() => {
          eventsRequestRef.current = null
        })
      }
      const nextEvents = await eventsRequestRef.current
      setEvents(nextEvents)
      setSelectedId((current) => {
        const requestedId = preferredId ?? current
        return nextEvents.some((event) => event.id === requestedId)
          ? requestedId
          : (nextEvents[0]?.id ?? null)
      })
      if (nextEvents.length === 0) setJoinersByEvent({})
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Could not load events.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const loadEventJoiners = useCallback(async (eventId: number) => {
    try {
      const eventJoiners = await eventsService.getJoiners(eventId)
      setJoinersByEvent((current) => ({
        ...current,
        [eventId]: eventJoiners,
      }))
    } catch {
      setJoinersByEvent((current) => ({
        ...current,
        [eventId]: [],
      }))
    }
  }, [])

  const loadMissingJoiners = useCallback(
    async (eventIds: number[]) => {
      const results = await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            return [eventId, await eventsService.getJoiners(eventId)] as const
          } catch {
            return [eventId, []] as const
          }
        }),
      )
      setJoinersByEvent((current) => ({
        ...current,
        ...Object.fromEntries(results),
      }))
    },
    [],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvents(), 0)
    return () => window.clearTimeout(timer)
  }, [loadEvents])

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
    const missingEventIds = requiredEventIds
      .filter((eventId) => !(eventId in joinersByEvent))
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
  }, [selectedId, visibleEvents])

  useEffect(() => {
    let socket: WebSocket | null = null
    const connectionTimer = window.setTimeout(() => {
      socket = new WebSocket(eventsService.getWebSocketUrl())
      socket.onopen = () => setLive(true)
      socket.onclose = () => setLive(false)
      socket.onmessage = (message) => {
        try {
          const notification = JSON.parse(
            String(message.data),
          ) as RealtimeNotification
          if (
            notification.type.startsWith('joiner.') &&
            typeof notification.event_id === 'number'
          ) {
            const eventId = notification.event_id
            const payload = isRecord(notification.payload)
              ? notification.payload
              : null
            const count = payload?.joiners_count
            if (typeof count === 'number') {
              setEvents((current) =>
                current.map((event) =>
                  event.id === eventId
                    ? { ...event, joiners_count: count }
                    : event,
                ),
              )
            }
            const changedJoiner = parseJoiner(payload?.joiner)
            if (changedJoiner) {
              setJoinersByEvent((current) => {
                const eventJoiners = current[eventId] ?? []
                return {
                  ...current,
                  [eventId]:
                    notification.type === 'joiner.joined'
                      ? [
                          ...eventJoiners.filter(
                            (joiner) =>
                              joiner.user_id !== changedJoiner.user_id,
                          ),
                          changedJoiner,
                        ]
                      : eventJoiners.filter(
                          (joiner) =>
                            joiner.user_id !== changedJoiner.user_id,
                        ),
                }
              })
            } else {
              void loadEventJoiners(eventId)
            }
            return
          }
          if (
            notification.type === 'location.updated' &&
            typeof notification.location_id === 'number' &&
            isRecord(notification.payload)
          ) {
            const locationId = notification.location_id
            const location = notification.payload
            setEvents((current) =>
              current.map((event) =>
                event.location_id === locationId
                  ? {
                      ...event,
                      location: {
                        ...event.location,
                        ...location,
                        id: locationId,
                      },
                    } as EventDetails
                  : event,
              ),
            )
            return
          }
          if (
            notification.type.startsWith('event.') &&
            notification.type !== 'event.created' &&
            typeof notification.event_id === 'number' &&
            isRecord(notification.payload)
          ) {
            const eventId = notification.event_id
            const payload = notification.payload
            setEvents((current) =>
              current.map((event) =>
                event.id === eventId
                  ? mergeEventPayload(event, payload)
                  : event,
              ),
            )
            return
          }
        } catch {
          // Unknown messages fall back to the authoritative event list.
        }
        void loadEvents()
      }
    }, 0)

    return () => {
      window.clearTimeout(connectionTimer)
      socket?.close()
    }
  }, [loadEventJoiners, loadEvents])

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
          : 'Could not update the event.',
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
          : 'Could not cancel the event.',
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
          : 'Could not restore the event.',
      )
    } finally {
      setBusy(false)
    }
  }

  function createUser(name: string) {
    const user = createAppUser(name)
    storeSessionUser(user.name)
    setCurrentUser(user)
  }

  function resetUser() {
    removeSessionUser()
    setCurrentUser(null)
    setJoinersByEvent({})
    setEventFilter('all')
    setCreateOpen(false)
    setEditOpen(false)
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
          : 'Could not create the event.',
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
          : 'Could not update the event.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0e0b] text-white">
      <header className="border-b border-white/8">
        <div className="mx-auto flex h-18 max-w-350 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-zinc-950">
              <Users className="size-4.5 fill-current" />
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-tight">Events real-time</p>
              <p className="text-[8px] uppercase tracking-[0.15em] text-white/25">
                Events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-[9px] font-bold uppercase sm:flex ${
                live
                  ? 'border-lime-300/15 bg-lime-300/6 text-lime-300'
                  : 'border-white/10 text-white/30'
              }`}
            >
              <Radio className="size-3" />
              {live ? 'Live sync' : 'Connecting'}
            </span>
            {currentUser && (
              <>
                <Button
                  className="rounded-full bg-lime-300 px-4 font-extrabold text-zinc-950 hover:bg-lime-200"
                  onClick={() => {
                    setCreateError(null)
                    setCreateOpen(true)
                  }}
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Create event</span>
                  <span className="sm:hidden">Create</span>
                </Button>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 pr-2">
                  <span className="grid size-7 place-items-center rounded-full bg-lime-300/10 text-[9px] font-bold text-lime-300">
                    {currentUser.initials}
                  </span>
                  <span className="hidden text-xs font-semibold sm:block">
                    {currentUser.name}
                  </span>
                  <button
                    aria-label="Change user"
                    className="grid size-7 place-items-center rounded-full text-white/30 hover:bg-white/10 hover:text-white"
                    onClick={resetUser}
                    title="Change user"
                    type="button"
                  >
                    <LogOut className="size-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-[1400px] lg:grid-cols-[360px_1fr]">
        <aside className="border-r border-white/[0.08] bg-[#f4f4ee] text-black">
          <div className="flex min-h-24 items-end justify-between gap-4 border-b border-black/[0.08] px-5 py-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/30">
                Event calendar
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {joinedOnly
                  ? 'Joined events'
                  : activeOnly
                    ? 'Active events'
                    : 'All events'}
              </h1>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-black/40">
              {visibleEvents.length}
            </span>
          </div>

          {(hasInactiveEvents || currentUser) && (
            <div className="flex gap-1 border-b border-black/[0.08] p-3">
              <button
                className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                  !activeOnly && !joinedOnly
                    ? 'bg-black text-white'
                    : 'text-black/40 hover:bg-black/5'
                }`}
                onClick={() => setEventFilter('all')}
                type="button"
              >
                All
              </button>
              {hasInactiveEvents && (
                <button
                  className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                    activeOnly
                      ? 'bg-black text-white'
                      : 'text-black/40 hover:bg-black/5'
                  }`}
                  onClick={() => setEventFilter('active')}
                  type="button"
                >
                  Active
                </button>
              )}
              {currentUser && (
                <button
                  className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                    joinedOnly
                      ? 'bg-violet-600 text-white'
                      : 'text-black/40 hover:bg-black/5'
                  }`}
                  onClick={() => setEventFilter('joined')}
                  type="button"
                >
                  Joined
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <LoaderCircle className="size-5 animate-spin text-black/25" />
            </div>
          ) : error && events.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-8 text-center">
              <RefreshCw className="size-5 text-black/25" />
              <p className="mt-4 text-sm font-bold">Unable to load events</p>
              <p className="mt-2 text-xs leading-5 text-black/40">{error}</p>
              <Button
                className="mt-5 rounded-full bg-black text-white"
                onClick={() => void loadEvents()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <EventList
              emptyDescription={
                joinedOnly
                  ? 'Only events joined by the current user are shown, including canceled and completed events.'
                  : activeOnly
                  ? 'Canceled and completed events are hidden by the active filter.'
                  : 'Events created in the service will appear here automatically.'
              }
              emptyTitle={
                joinedOnly
                  ? 'No joined events'
                  : activeOnly
                    ? 'No active events'
                    : 'No events yet'
              }
              events={visibleEvents}
              joinedEventIds={joinedEventIds}
              now={now}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          )}
        </aside>

        <section className="min-w-0 px-5 py-8 sm:px-8 lg:px-12">
          {error && events.length > 0 && (
            <p className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300">
              {error}
            </p>
          )}
          {selectedEvent ? (
            <EventDetail
              busy={busy}
              currentUser={currentUser}
              event={selectedEvent}
              joiners={selectedJoiners}
              now={now}
              onCancel={() => void cancelSelectedEvent()}
              onEdit={() => {
                setEditError(null)
                setEditOpen(true)
              }}
              onJoinToggle={() => void toggleJoin()}
              onRestore={() => void restoreSelectedEvent()}
            />
          ) : (
            <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
              <CalendarDays className="size-6 text-white/15" />
              <p className="mt-4 text-sm font-semibold text-white/30">
                Select an event to see its details.
              </p>
            </div>
          )}
        </section>
      </div>

      {currentUser && (
        <>
          <CreateEventDialog
            currentUser={currentUser}
            error={createError}
            onClose={() => {
              if (!busy) setCreateOpen(false)
            }}
            onCreate={(input) => void createNewEvent(input)}
            open={createOpen}
            saving={busy}
          />
          {selectedEvent && (
            <EditEventDialog
              error={editError}
              event={selectedEvent}
              onClose={() => {
                if (!busy) setEditOpen(false)
              }}
              onUpdate={(input) => void updateSelectedEvent(input)}
              open={editOpen}
              saving={busy}
            />
          )}
        </>
      )}
      {!currentUser && (
        <WelcomeScreen onCreateUser={createUser} />
      )}
    </main>
  )
}
