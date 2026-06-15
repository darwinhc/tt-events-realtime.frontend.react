import {CalendarDays, Check, Clock3, Edit3, LoaderCircle, MapPin, RotateCcw, UserRound, Users,} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import type {AppUser, EventDetails, EventJoiner,} from '@/domains/events/types/event.types'
import {
  formatDuration,
  formatEventDate,
  formatEventTime,
  getEventTimingStatus,
  getLocationDisplay,
} from '@/domains/events/utils/event-formatters'

interface EventDetailProps {
  event: EventDetails
  joiners: EventJoiner[]
  currentUser: AppUser | null
  busy: boolean
  now: number
  onJoinToggle: () => void
  onCancel: () => void
  onEdit: () => void
  onRestore: () => void
}

export function EventDetail({
  event,
  joiners,
  currentUser,
  busy,
  now,
  onJoinToggle,
  onCancel,
  onEdit,
  onRestore,
}: EventDetailProps) {
  const date = formatEventDate(event.scheduled_at)
  const isOrganizer = event.organizer === currentUser?.name
  const hasJoined = joiners.some(
    (joiner) => joiner.user_name === currentUser?.name,
  )
  const isCanceled = event.status === 'canceled'
  const timingStatus = getEventTimingStatus(event, now)
  const isInProgress = !isCanceled && timingStatus === 'in-progress'
  const isCompleted = !isCanceled && timingStatus === 'completed'
  const location = getLocationDisplay(event)

  const details = [
    { icon: CalendarDays, label: 'Date', value: date.full },
    {
      icon: Clock3,
      label: 'Time and duration',
      value: `${formatEventTime(event.scheduled_at)} · ${formatDuration(
        event.duration_in_minutes,
      )}`,
    },
    {
      icon: UserRound,
      label: 'Organizer',
      value: event.organizer.replace(/[-_]/g, ' '),
    },
  ]

  return (
    <article className="event-detail-enter">
      <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider ${
                isCanceled
                  ? 'border-red-400/20 bg-red-400/10 text-red-300'
                  : isCompleted
                    ? 'border-sky-300/20 bg-sky-300/10 text-sky-200'
                    : isInProgress
                      ? 'border-amber-300/20 bg-amber-300/10 text-amber-200'
                  : 'border-lime-300/20 bg-lime-300/[0.07] text-lime-300'
              }`}
            >
              {isCanceled
                ? 'Canceled'
                : isCompleted
                  ? 'Completed'
                  : isInProgress
                    ? 'In progress'
                    : 'Open event'}
            </span>
            {hasJoined && (
              <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-violet-200">
                Joined
              </span>
            )}
            <span className="text-[10px] text-white/25">Event #{event.id}</span>
          </div>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tighter text-white sm:text-5xl">
            {event.title}
          </h1>
          <p className="mt-4 text-sm capitalize text-white/40">
            Organized by{' '}
            <strong className="text-white/75">
              {event.organizer.replace(/[-_]/g, ' ')}
            </strong>
          </p>
        </div>

        {!currentUser ? (
          <Button
            className="rounded-full bg-lime-300 font-extrabold text-zinc-950"
            disabled
          >
            Enter your name to join
          </Button>
        ) : isOrganizer ? (
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-full border border-white/15 bg-white/6 text-white hover:bg-white/10"
              disabled={busy}
              onClick={onEdit}
            >
              <Edit3 className="size-4" />
              Edit event
            </Button>
            <Button
              className={
                isCanceled
                  ? 'rounded-full bg-lime-300 font-extrabold text-zinc-950 hover:bg-lime-200'
                  : 'rounded-full border border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/20'
              }
              disabled={busy || isCompleted}
              onClick={isCanceled ? onRestore : onCancel}
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : isCanceled ? (
                <RotateCcw className="size-4" />
              ) : null}
              {isCanceled
                ? 'Restore event'
                : isCompleted
                  ? 'Event completed'
                  : 'Cancel event'}
            </Button>
          </div>
        ) : (
          <Button
            className={
              hasJoined
                ? 'rounded-full border border-white/15 bg-white/6 text-white hover:bg-white/10'
                : 'rounded-full bg-lime-300 font-extrabold text-zinc-950 hover:bg-lime-200'
            }
            disabled={busy || isCanceled || isCompleted}
            onClick={onJoinToggle}
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : hasJoined ? (
              <Check className="size-4" />
            ) : (
              <Users className="size-4" />
            )}
            {isCompleted
              ? 'Event completed'
              : hasJoined
                ? 'Leave event'
                : 'Join event'}
          </Button>
        )}
      </div>

      <div className="grid gap-5 py-8 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {details.map(({ icon: Icon, label, value }) => (
            <Card
              className="border-white/8 bg-white/[0.035] text-white shadow-none"
              key={label}
            >
              <CardContent className="p-5">
                <Icon className="mb-7 size-4 text-lime-300" />
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/25">
                  {label}
                </p>
                <p className="mt-1.5 text-sm font-semibold capitalize text-white/80">
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
          <Card className="border-white/8 bg-white/[0.035] text-white shadow-none sm:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/25">
                    Location
                  </p>
                  <p className="mt-2 text-base font-bold text-white/90">
                    {location.venue}
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                  <MapPin className="size-4" />
                </span>
              </div>

              <div className="mt-5 space-y-2 border-t border-white/8 pt-4">
                {location.address && (
                  <p className="text-sm leading-6 text-white/65">
                    {location.address}
                  </p>
                )}
                {location.region && (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-white/45">
                      {location.region}
                    </p>
                    {location.countryCode && (
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-extrabold tracking-wider text-white/40">
                        {location.countryCode}
                      </span>
                    )}
                  </div>
                )}
                {!location.address && !location.region && (
                  <p className="text-xs text-white/30">
                    No address details provided.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/8 bg-white/[0.035] text-white shadow-none">
          <CardContent className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/25">
                  People joining
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {joiners.length}{' '}
                  {joiners.length === 1 ? 'attendee' : 'attendees'}
                </p>
              </div>
              <Users className="size-4 text-lime-300" />
            </div>
            <div className="space-y-2">
              {joiners.length > 0 ? (
                joiners.map((joiner) => (
                  <div
                    className="flex items-center gap-3 rounded-xl bg-white/4 p-3"
                    key={joiner.id ?? `${joiner.event_id}-${joiner.user_id}`}
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-lime-300/10 text-[9px] font-extrabold text-lime-300">
                      {joiner.user_name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold capitalize text-white/70">
                      {joiner.user_name.replace(/[-_]/g, ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-white/25">
                  No one has joined yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </article>
  )
}
