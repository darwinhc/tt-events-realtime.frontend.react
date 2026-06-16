import {CalendarDays, LoaderCircle, LogOut, Plus, Radio, RefreshCw, Users,} from 'lucide-react'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'

import {DemoDataNotice} from '@/components/ui/DemoDataNotice'
import {LanguageSwitcher} from '@/components/ui/LanguageSwitcher'
import {Button} from '@/components/ui/button'
import {CreateEventDialog} from '@/domains/events/components/CreateEventDialog'
import {EditEventDialog} from '@/domains/events/components/EditEventDialog'
import {EventDetail} from '@/domains/events/components/EventDetail'
import {EventList} from '@/domains/events/components/EventList'
import {WelcomeScreen} from '@/domains/events/components/WelcomeScreen'
import {useEventFilters} from '@/domains/events/hooks/useEventFilters'
import {useEventsData} from '@/domains/events/hooks/useEventsData'
import {useEventsRealtime} from '@/domains/events/hooks/useEventsRealtime'
import {useSessionUser} from '@/domains/events/hooks/useSessionUser'
import type {CreateEventInput, EditEventInput,} from '@/domains/events/types/event.types'
import {eventsService} from '@/services/events/events.service'

type EventFilter = 'all' | 'active' | 'joined'

export function EventsScreen() {
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

  const {currentUser, createUser, resetSessionUser} = useSessionUser()
  const {t} = useTranslation()

  function resetUser() {
    resetSessionUser()
    setJoinersByEvent({})
    setEventFilter('all')
    setCreateOpen(false)
    setEditOpen(false)
  }

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
  }, [selectedId, setSelectedId, visibleEvents])

  useEventsRealtime({
    loadEvents,
    loadEventJoiners,
    setEvents,
    setJoinersByEvent,
    setLive,
  })


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
              ? {...event, joiners_count: event.joiners_count + 1}
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

  return (
    <main className="min-h-screen bg-[#0b0e0b] text-white">
      <header className="border-b border-white/8">
        <div className="mx-auto flex h-18 max-w-350 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-zinc-950">
              <Users className="size-4.5 fill-current"/>
            </span>

            <div>
              <p className="text-sm font-extrabold tracking-tight">
                {t('events.header.title')}
              </p>
              <p className="text-[8px] uppercase tracking-[0.15em] text-white/25">
                {t('events.header.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-[9px] font-bold uppercase sm:flex ${
                live
                  ? 'border-lime-300/15 bg-lime-300/6 text-lime-300'
                  : 'border-amber-300/15 bg-amber-300/6 text-amber-300'
              }`}
            >
              <Radio className="size-3"/>
              {live ? t('common.liveSync') : t('common.notConnected')}
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
                  <Plus className="size-4"/>
                  <span className="hidden sm:inline">
                    {t('common.createEvent')}
                  </span>
                  <span className="sm:hidden">
                    {t('common.create')}
                  </span>
                </Button>

                <div
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 p-1 pr-2">
                  <span
                    className="grid size-7 place-items-center rounded-full bg-lime-300/10 text-[9px] font-bold text-lime-300">
                    {currentUser.initials}
                  </span>

                  <span className="hidden text-xs font-semibold sm:block">
                    {currentUser.name}
                  </span>

                  <button
                    aria-label={t('events.user.changeUser')}
                    className="grid size-7 place-items-center rounded-full text-white/30 hover:bg-white/10 hover:text-white"
                    onClick={resetUser}
                    title={t('events.user.changeUser')}
                    type="button"
                  >
                    <LogOut className="size-3.5"/>
                  </button>
                </div>

                <LanguageSwitcher/>
              </>
            )}
          </div>
        </div>
      </header>

      <DemoDataNotice/>

      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-350 lg:grid-cols-[360px_1fr]">
        <aside className="border-r border-white/8 bg-[#f4f4ee] text-black">
          <div className="flex min-h-24 items-end justify-between gap-4 border-b border-black/8 px-5 py-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/30">
                {t('events.sidebar.calendarLabel')}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {sidebarTitle}
              </h1>
            </div>

            <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-black/40">
              {visibleEvents.length}
            </span>
          </div>

          {(hasInactiveEvents || currentUser) && (
            <div className="flex gap-1 border-b border-black/8 p-3">
              <button
                className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                  !activeOnly && !joinedOnly
                    ? 'bg-black text-white'
                    : 'text-black/40 hover:bg-black/5'
                }`}
                onClick={() => setEventFilter('all')}
                type="button"
              >
                {t('events.filters.all')}
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
                  {t('events.filters.active')}
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
                  {t('events.filters.joined')}
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-90 items-center justify-center">
              <LoaderCircle className="size-5 animate-spin text-black/25"/>
            </div>
          ) : error && events.length === 0 ? (
            <div className="flex min-h-90 flex-col items-center justify-center px-8 text-center">
              <RefreshCw className="size-5 text-black/25"/>
              <p className="mt-4 text-sm font-bold">
                {t('events.errors.unableToLoadEvents')}
              </p>
              <p className="mt-2 text-xs leading-5 text-black/40">
                {error}
              </p>

              <Button
                className="mt-5 rounded-full bg-black text-white"
                onClick={() => void loadEvents()}
              >
                {t('common.tryAgain')}
              </Button>
            </div>
          ) : (
            <EventList
              emptyDescription={emptyDescription}
              emptyTitle={emptyTitle}
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
              <CalendarDays className="size-6 text-white/15"/>
              <p className="mt-4 text-sm font-semibold text-white/30">
                {t('events.selectionPrompt')}
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
        <WelcomeScreen onCreateUser={createUser}/>
      )}
    </main>
  )
}