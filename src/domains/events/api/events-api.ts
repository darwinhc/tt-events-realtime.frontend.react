import type {CreateEventInput, UpdateEventInput, UpdateLocationInput,} from '@/domains/events/types/event.types.ts'
import {createHttpClient} from '@/shared/http/http-client.ts'

import type {
  CreatedEventResponse,
  EventDetailsResponse,
  EventJoinerInfoResponse,
  EventJoinerResponse,
  EventLocationResponse,
} from './events-api.types.ts'

const API_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

const httpClient = createHttpClient(API_URL)

export const eventsApi = {
  getEvents: () => httpClient.request<EventDetailsResponse[]>('/events'),

  getJoiners: (eventId: number) =>
    httpClient.request<EventJoinerResponse[]>(`/events/${eventId}/joiners`),

  getJoinersForEvents: (eventIds: number[]) => {
    if (eventIds.length === 0) {
      return Promise.resolve([])
    }

    return httpClient.request<EventJoinerInfoResponse[]>('/joiners', {
      query: {
        event_ids: eventIds,
      },
    })
  },

  join: (eventId: number, userName: string) =>
    httpClient.request<EventJoinerResponse>('/joiners', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userName}`,
      },
      body: JSON.stringify({
        event_id: eventId,
      }),
    }),

  leave: (eventId: number, userName: string) =>
    httpClient.request<EventJoinerResponse>(`/joiners/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userName}`,
      },
    }),

  cancel: (eventId: number, userName: string) =>
    httpClient.request<CreatedEventResponse>(`/events/${eventId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userName}`,
      },
    }),

  uncancel: (eventId: number, userName: string) =>
    httpClient.request<CreatedEventResponse>(`/events/${eventId}/uncancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userName}`,
      },
    }),

  update: (eventId: number, input: UpdateEventInput, userName: string) =>
    httpClient.request<CreatedEventResponse>(`/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userName}`,
      },
      body: JSON.stringify(input),
    }),

  updateLocation: (
    locationId: number,
    input: UpdateLocationInput,
    userName: string,
  ) =>
    httpClient.request<EventLocationResponse>(`/locations/${locationId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userName}`,
      },
      body: JSON.stringify(input),
    }),

  create: (input: CreateEventInput, userName: string) =>
    httpClient.request<CreatedEventResponse>('/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userName}`,
      },
      body: JSON.stringify(input),
    }),

  getWebSocketUrl: () => {
    const configuredUrl = import.meta.env.VITE_WS_BASE_URL?.replace(/\/$/, '')

    if (configuredUrl) {
      return configuredUrl.endsWith('/ws/events')
        ? configuredUrl
        : `${configuredUrl}/ws/events`
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'

    return `${protocol}://${window.location.host}/ws/events`
  },
}