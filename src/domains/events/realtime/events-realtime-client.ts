import type {
  EventRealtimePatch,
  EventsRealtimeDomainEvent,
  LocationRealtimePatch,
} from '@/domains/events/realtime/events-realtime-domain-event'
import type {EventLocation} from '@/domains/events/types/event.types'
import {isRecord, parseJoiner} from '@/domains/events/utils/event-payload'

interface EventsRealtimeClientOptions {
  getUrl: () => string
  onOpen: (context: { shouldRefresh: boolean }) => void
  onClose: () => void
  onDomainEvent: (event: EventsRealtimeDomainEvent) => void
  onInvalidMessage?: (message: MessageEvent) => void
}

interface RawRealtimeNotification {
  type: string
  event_id?: number
  location_id?: number
  payload?: unknown
}

function calcReconnectionTime(reconnectAttempts: number): number {
  return Math.min(1000 * 2 ** reconnectAttempts, 15000)
}

function parseJsonRecord(value: unknown): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(String(value)) as unknown
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function parseRawNotification(
  message: MessageEvent,
): RawRealtimeNotification | null {
  const value = parseJsonRecord(message.data)

  if (!value || typeof value.type !== 'string') {
    return null
  }

  return {
    type: value.type,
    event_id: typeof value.event_id === 'number' ? value.event_id : undefined,
    location_id:
      typeof value.location_id === 'number' ? value.location_id : undefined,
    payload: value.payload,
  }
}

function parseNullableString(value: unknown): string | null | undefined {
  if (typeof value === 'string') {
    return value
  }

  if (value === null) {
    return null
  }

  return undefined
}

function parseCoordinates(
  value: unknown,
): EventLocation['coordinates'] | undefined {
  if (value === null) {
    return null
  }

  if (
    !isRecord(value) ||
    typeof value.latitude !== 'number' ||
    typeof value.longitude !== 'number'
  ) {
    return undefined
  }

  return {
    latitude: value.latitude,
    longitude: value.longitude,
  }
}

function parseEventPatch(payload: unknown): EventRealtimePatch {
  if (!isRecord(payload)) {
    return {}
  }

  const patch: EventRealtimePatch = {}

  if (typeof payload.title === 'string') {
    patch.title = payload.title
  }

  if (typeof payload.organizer === 'string') {
    patch.organizer = payload.organizer
  }

  if (typeof payload.organizer_id === 'number') {
    patch.organizer_id = payload.organizer_id
  }

  if (typeof payload.duration_in_minutes === 'number') {
    patch.duration_in_minutes = payload.duration_in_minutes
  }

  if (typeof payload.location_id === 'number') {
    patch.location_id = payload.location_id
  }

  const scheduledAt = parseNullableString(payload.scheduled_at)
  if (scheduledAt !== undefined) {
    patch.scheduled_at = scheduledAt
  }

  if (payload.status === 'active' || payload.status === 'canceled') {
    patch.status = payload.status
  }

  const canceledAt = parseNullableString(payload.canceled_at)
  if (canceledAt !== undefined) {
    patch.canceled_at = canceledAt
  }

  const deletionScheduledAt = parseNullableString(
    payload.deletion_scheduled_at,
  )
  if (deletionScheduledAt !== undefined) {
    patch.deletion_scheduled_at = deletionScheduledAt
  }

  return patch
}

function parseLocationPatch(
  locationId: number,
  payload: unknown,
): LocationRealtimePatch | null {
  if (!isRecord(payload)) {
    return null
  }

  const location: LocationRealtimePatch = {
    id: locationId,
  }

  const name = parseNullableString(payload.name)
  if (name !== undefined) {
    location.name = name
  }

  const address = parseNullableString(payload.address)
  if (address !== undefined) {
    location.address = address
  }

  const country = parseNullableString(payload.country)
  if (country !== undefined) {
    location.country = country
  }

  const city = parseNullableString(payload.city)
  if (city !== undefined) {
    location.city = city
  }

  const postalCode = parseNullableString(payload.postal_code)
  if (postalCode !== undefined) {
    location.postal_code = postalCode
  }

  const coordinates = parseCoordinates(payload.coordinates)
  if (coordinates !== undefined) {
    location.coordinates = coordinates
  }

  return location
}

function parseJoinersCount(payload: unknown): number | null {
  if (!isRecord(payload) || typeof payload.joiners_count !== 'number') {
    return null
  }

  return payload.joiners_count
}

export function parseEventsRealtimeDomainEvent(
  message: MessageEvent,
): EventsRealtimeDomainEvent | null {
  const notification = parseRawNotification(message)

  if (!notification) {
    return null
  }

  if (
    notification.type === 'event.created' &&
    typeof notification.event_id === 'number'
  ) {
    return {
      type: 'event.created',
      eventId: notification.event_id,
    }
  }

  if (
    (
      notification.type === 'event.updated' ||
      notification.type === 'event.canceled' ||
      notification.type === 'event.uncanceled'
    ) &&
    typeof notification.event_id === 'number'
  ) {
    return {
      type: notification.type,
      eventId: notification.event_id,
      patch: parseEventPatch(notification.payload),
    }
  }

  if (
    (
      notification.type === 'joiner.joined' ||
      notification.type === 'joiner.left'
    ) &&
    typeof notification.event_id === 'number'
  ) {
    const payload = isRecord(notification.payload)
      ? notification.payload
      : null

    return {
      type: notification.type,
      eventId: notification.event_id,
      joiner: parseJoiner(payload?.joiner),
      joinersCount: parseJoinersCount(payload),
    }
  }

  if (
    notification.type === 'location.updated' &&
    typeof notification.location_id === 'number'
  ) {
    const location = parseLocationPatch(
      notification.location_id,
      notification.payload,
    )

    if (!location) {
      return null
    }

    return {
      type: 'location.updated',
      locationId: notification.location_id,
      location,
    }
  }

  return null
}

export class EventsRealtimeClient {
  private readonly options: EventsRealtimeClientOptions
  private socket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private closed = false
  private hasOpenedOnce = false

  constructor(options: EventsRealtimeClientOptions) {
    this.options = options
  }

  start() {
    this.closed = false
    this.connect()

    window.addEventListener('online', this.reconnectNow)
    window.addEventListener('offline', this.handleOffline)
  }

  stop() {
    this.closed = true

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    window.removeEventListener('online', this.reconnectNow)
    window.removeEventListener('offline', this.handleOffline)

    const currentSocket = this.socket
    this.socket = null
    currentSocket?.close()
  }

  private readonly reconnectNow = () => {
    if (this.closed) {
      return
    }

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    const previousSocket = this.socket
    this.socket = null
    previousSocket?.close()
    this.connect()
  }

  private readonly handleOffline = () => {
    this.options.onClose()
  }

  private scheduleReconnect() {
    if (this.closed || this.reconnectTimer !== null) {
      return
    }

    const delay = calcReconnectionTime(this.reconnectAttempts)
    this.reconnectAttempts += 1

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private connect() {
    if (this.closed) {
      return
    }

    if (
      this.socket &&
      (
        this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN
      )
    ) {
      return
    }

    const nextSocket = new WebSocket(this.options.getUrl())
    this.socket = nextSocket

    nextSocket.onopen = () => {
      if (this.socket !== nextSocket) {
        return
      }

      const shouldRefresh = this.hasOpenedOnce || this.reconnectAttempts > 0

      this.hasOpenedOnce = true
      this.reconnectAttempts = 0
      this.options.onOpen({shouldRefresh})
    }

    nextSocket.onclose = () => {
      if (this.socket !== nextSocket) {
        return
      }

      this.options.onClose()
      this.scheduleReconnect()
    }

    nextSocket.onerror = () => {
      if (this.socket !== nextSocket) {
        return
      }

      nextSocket.close()
    }

    nextSocket.onmessage = (message) => {
      if (this.socket !== nextSocket) {
        return
      }

      const domainEvent = parseEventsRealtimeDomainEvent(message)

      if (!domainEvent) {
        this.options.onInvalidMessage?.(message)
        return
      }

      this.options.onDomainEvent(domainEvent)
    }
  }
}