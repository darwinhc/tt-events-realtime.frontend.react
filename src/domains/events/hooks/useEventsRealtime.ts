import {useEffect} from 'react'

import type {EventDetails} from '@/domains/events/types/event.types'
import {eventsService} from '@/services/events/events.service'
import type {RealtimeNotification, UseEventsRealtimeOptions} from "@/domains/events/types/events-realtime.types.ts";
import {isRecord, mergeEventPayload, parseJoiner} from "@/domains/events/utils/event-payload.ts";


function calcReconnectionTime(reconnectAttempts: number): number {
  return Math.min(1000 * 2 ** reconnectAttempts, 15000);
}


export function useEventsRealtime({
                                    loadEvents,
                                    loadEventJoiners,
                                    setEvents,
                                    setJoinersByEvent,
                                    setLive,
                                  }: UseEventsRealtimeOptions) {
  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimer: number | null = null
    let reconnectAttempts = 0
    let closedByComponent = false

    function scheduleReconnect() {
      if (closedByComponent || reconnectTimer !== null) return

      const delay = calcReconnectionTime(reconnectAttempts)
      reconnectAttempts += 1

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null
        connect()
      }, delay)
    }

    function handleJoinerNotification(notification: RealtimeNotification) {
      if (
        !notification.type.startsWith('joiner.') ||
        typeof notification.event_id !== 'number'
      ) {
        return false
      }

      const eventId = notification.event_id
      const payload = isRecord(notification.payload)
        ? notification.payload
        : null
      const count = payload?.joiners_count

      if (typeof count === 'number') {
        setEvents((current) =>
          current.map((event) =>
            event.id === eventId
              ? {...event, joiners_count: count}
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

      return true
    }

    function handleLocationNotification(notification: RealtimeNotification) {
      if (
        notification.type !== 'location.updated' ||
        typeof notification.location_id !== 'number' ||
        !isRecord(notification.payload)
      ) {
        return false
      }

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

      return true
    }

    function handleEventNotification(notification: RealtimeNotification) {
      if (
        !notification.type.startsWith('event.') ||
        notification.type === 'event.created' ||
        typeof notification.event_id !== 'number' ||
        !isRecord(notification.payload)
      ) {
        return false
      }

      const eventId = notification.event_id
      const payload = notification.payload

      setEvents((current) =>
        current.map((event) =>
          event.id === eventId
            ? mergeEventPayload(event, payload)
            : event,
        ),
      )

      return true
    }

    function handleMessage(message: MessageEvent) {
      try {
        const notification = JSON.parse(
          String(message.data),
        ) as RealtimeNotification

        const handled =
          handleJoinerNotification(notification) ||
          handleLocationNotification(notification) ||
          handleEventNotification(notification)

        if (handled) return
      } catch {
        // Unknown messages fall back to the authoritative event list.
      }

      void loadEvents()
    }

    function connect() {
      if (closedByComponent) return

      if (
        socket &&
        (
          socket.readyState === WebSocket.CONNECTING ||
          socket.readyState === WebSocket.OPEN
        )
      ) {
        return
      }

      socket = new WebSocket(eventsService.getWebSocketUrl())

      socket.onopen = () => {
        reconnectAttempts = 0
        setLive(true)
        void loadEvents()
      }

      socket.onclose = () => {
        setLive(false)
        scheduleReconnect()
      }

      socket.onerror = () => {
        socket?.close()
      }

      socket.onmessage = handleMessage
    }

    function reconnectNow() {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = null
      }

      socket?.close()
      socket = null
      connect()
    }

    function handleOffline() {
      setLive(false)
    }

    connect()

    window.addEventListener('online', reconnectNow)
    window.addEventListener('offline', handleOffline)

    return () => {
      closedByComponent = true

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
      }

      window.removeEventListener('online', reconnectNow)
      window.removeEventListener('offline', handleOffline)

      socket?.close()
    }
  }, [
    loadEventJoiners,
    loadEvents,
    setEvents,
    setJoinersByEvent,
    setLive,
  ])
}
