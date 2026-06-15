import type {
  CreatedEvent,
  CreateEventInput,
  EventDetails,
  EventJoiner,
  EventLocation,
  UpdateLocationInput,
  UpdateEventInput,
} from '@/domains/events/types/event.types'

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

function getErrorMessage(body: unknown, status: number) {
  if (
    body &&
    typeof body === 'object' &&
    'detail' in body
  ) {
    const detail = body.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (!item || typeof item !== 'object' || !('msg' in item)) return null
          return typeof item.msg === 'string' ? item.msg : null
        })
        .filter((message): message is string => Boolean(message))
      if (messages.length > 0) return messages.join(', ')
    }
  }
  return `Request failed (${status}).`
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(getErrorMessage(body, response.status))
  }

  return (await response.json()) as T
}

export const eventsService = {
  getEvents: () => request<EventDetails[]>('/events'),
  getJoiners: (eventId: number) =>
    request<EventJoiner[]>(`/events/${eventId}/joiners`),
  join: (eventId: number, userName: string) =>
    request<EventJoiner>('/joiners', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userName}` },
      body: JSON.stringify({ event_id: eventId }),
    }),
  leave: (eventId: number, userName: string) =>
    request<EventJoiner>(`/joiners/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userName}` },
    }),
  cancel: (eventId: number, userName: string) =>
    request<CreatedEvent>(`/events/${eventId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userName}` },
    }),
  uncancel: (eventId: number, userName: string) =>
    request<CreatedEvent>(`/events/${eventId}/uncancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userName}` },
    }),
  update: (eventId: number, input: UpdateEventInput, userName: string) =>
    request<CreatedEvent>(`/events/${eventId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userName}` },
      body: JSON.stringify(input),
    }),
  updateLocation: (
    locationId: number,
    input: UpdateLocationInput,
    userName: string,
  ) =>
    request<EventLocation>(`/locations/${locationId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userName}` },
      body: JSON.stringify(input),
    }),
  create: (input: CreateEventInput, userName: string) =>
    request<CreatedEvent>('/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userName}` },
      body: JSON.stringify(input),
    }),
  getWebSocketUrl: () => {
    const configuredUrl = import.meta.env.VITE_WS_URL?.replace(/\/$/, '')
    if (configuredUrl) {
      return configuredUrl.endsWith('/ws/events')
        ? configuredUrl
        : `${configuredUrl}/ws/events`
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${window.location.host}/ws/events`
  },
}
