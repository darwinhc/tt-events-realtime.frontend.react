import {CalendarDays, MapPin, Users} from 'lucide-react'

import type {EventDetails} from '@/domains/events/types/event.types'
import {formatEventDate, getEventTimingStatus, getLocationDisplay,} from '@/domains/events/utils/event-formatters'

interface EventListProps {
    events: EventDetails[]
    joinedEventIds: ReadonlySet<number>
    selectedId: number | null
    now: number
    onSelect: (eventId: number) => void
    emptyTitle?: string
    emptyDescription?: string
}

export function EventList({
                              events,
                              joinedEventIds,
                              selectedId,
                              now,
                              onSelect,
                              emptyTitle = 'No events yet',
                              emptyDescription = 'Events created in the service will appear here automatically.',
                          }: EventListProps) {
    if (events.length === 0) {
        return (
            <div className="flex min-h-90 flex-col items-center justify-center px-8 text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-black/5 text-black/30">
                    <CalendarDays className="size-5"/>
                </div>
                <h2 className="mt-4 font-display text-lg font-bold">{emptyTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-black/40">
                    {emptyDescription}
                </p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-black/[0.07]">
            {events.map((event) => {
                const date = formatEventDate(event.scheduled_at)
                const location = getLocationDisplay(event)
                const isSelected = selectedId === event.id
                const isCanceled = event.status === 'canceled'
                const hasJoined = joinedEventIds.has(event.id)
                const timingStatus = getEventTimingStatus(event, now)
                const isInProgress = !isCanceled && timingStatus === 'in-progress'
                const isCompleted = !isCanceled && timingStatus === 'completed'

                return (
                    <button
                        className={`w-full px-5 py-5 text-left transition-colors ${
                            isSelected ? 'bg-lime-200' : 'hover:bg-black/[0.035]'
                        }`}
                        key={event.id}
                        onClick={() => onSelect(event.id)}
                        type="button"
                    >
                        <div className="flex gap-4">
                            <div
                                className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-xl ${
                                    isSelected ? 'bg-black text-white' : 'bg-black/6'
                                }`}
                            >
                <span className="text-[8px] font-extrabold uppercase tracking-wider">
                  {date.month}
                </span>
                                <strong className="text-lg leading-none">{date.day}</strong>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <h3
                                        className={`truncate text-sm font-extrabold ${
                                            isCanceled || isCompleted
                                                ? 'text-black/35 line-through'
                                                : 'text-black/80'
                                        }`}
                                    >
                                        {event.title}
                                    </h3>
                                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                                        {hasJoined && (
                                            <span
                                                className="rounded-full bg-violet-500/10 px-2 py-1 text-[8px] font-bold uppercase text-violet-700">
                        Joined
                      </span>
                                        )}
                                        {(isCanceled || isCompleted || isInProgress) && (
                                            <span
                                                className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase ${
                                                    isCanceled
                                                        ? 'bg-red-500/10 text-red-700'
                                                        : isCompleted
                                                            ? 'bg-sky-500/10 text-sky-700'
                                                            : 'bg-amber-500/10 text-amber-700'
                                                }`}
                                            >
                        {isCanceled
                            ? 'Canceled'
                            : isCompleted
                                ? 'Completed'
                                : 'In progress'}
                      </span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 flex items-start gap-1.5">
                                    <MapPin className="mt-0.5 size-3 shrink-0 text-black/35"/>
                                    <div className="min-w-0">
                                        <p className="truncate text-[11px] font-semibold text-black/55">
                                            {location.venue}
                                        </p>
                                        {location.address && (
                                            <p className="truncate text-[10px] leading-4 text-black/40">
                                                {location.address}
                                            </p>
                                        )}
                                        {location.region && (
                                            <p className="truncate text-[9px] leading-4 text-black/30">
                                                {location.region}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-black/45">
                                    <Users className="size-3"/>
                                    {event.joiners_count}{' '}
                                    {event.joiners_count === 1 ? 'person' : 'people'} joining
                                </p>
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
