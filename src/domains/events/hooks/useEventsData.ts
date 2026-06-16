import {useCallback, useEffect, useRef, useState} from 'react'

import type {EventDetails, EventJoiner,} from '@/domains/events/types/event.types'
import {eventsService} from '@/services/events/events.service'

export function useEventsData() {
    const eventsRequestRef = useRef<Promise<EventDetails[]> | null>(null)

    const [events, setEvents] = useState<EventDetails[]>([])
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [joinersByEvent, setJoinersByEvent] = useState<
        Record<number, EventJoiner[]>
    >({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

            if (nextEvents.length === 0) {
                setJoinersByEvent({})
            }

            setError(null)
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Could not load events.',
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

    const loadMissingJoiners = useCallback(async (eventIds: number[]) => {
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
    }, [])

    useEffect(() => {
        const timer = window.setTimeout(() => void loadEvents(), 0)

        return () => {
            window.clearTimeout(timer)
        }
    }, [loadEvents])

    return {
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
    }
}