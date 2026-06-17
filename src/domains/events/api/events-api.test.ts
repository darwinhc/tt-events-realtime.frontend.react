import {beforeEach, describe, expect, it, vi} from 'vitest'
import {eventsApi} from '@/domains/events/api/events-api.ts'
import type {CreateEventInput, UpdateEventInput, UpdateLocationInput,} from '@/domains/events/types/event.types.ts'

const requestMock = vi.hoisted(() => vi.fn())

vi.mock('@/shared/http/http-client', () => ({
  createHttpClient: vi.fn(() => ({
    request: requestMock,
  })),
}))

describe('eventsApi', () => {
  beforeEach(() => {
    requestMock.mockReset()
    requestMock.mockResolvedValue({})
  })

  it('requests event and joiner read endpoints', async () => {
    await eventsApi.getEvents()
    await eventsApi.getJoiners(1)
    await eventsApi.getJoinersForEvents([1, 2])

    expect(requestMock).toHaveBeenNthCalledWith(1, '/events')
    expect(requestMock).toHaveBeenNthCalledWith(2, '/events/1/joiners')
    expect(requestMock).toHaveBeenNthCalledWith(3, '/joiners', {
      query: {
        event_ids: [1, 2],
      },
    })
  })

  it('does not call the API when no event ids are provided for batch joiners', async () => {
    await expect(eventsApi.getJoinersForEvents([])).resolves.toEqual([])

    expect(requestMock).not.toHaveBeenCalled()
  })

  it('requests authenticated joiner mutations', async () => {
    await eventsApi.join(1, 'Sofia Martinez')
    await eventsApi.leave(1, 'Sofia Martinez')

    expect(requestMock).toHaveBeenNthCalledWith(1, '/joiners', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer Sofia Martinez',
      },
      body: JSON.stringify({event_id: 1}),
    })
    expect(requestMock).toHaveBeenNthCalledWith(2, '/joiners/1', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer Sofia Martinez',
      },
    })
  })

  it('requests authenticated event mutations', async () => {
    const eventInput: UpdateEventInput = {
      title: 'Updated meetup',
      scheduled_at: '2026-08-20T18:30:00.000Z',
      duration_in_minutes: 90,
    }
    const createInput: CreateEventInput = {
      title: 'New meetup',
      scheduled_at: null,
      duration_in_minutes: 60,
      location: {
        name: 'Factory Berlin',
        address: 'Lohmühlenstraße 65',
        country: 'DE',
        city: 'Berlin',
        postal_code: null,
      },
    }

    await eventsApi.cancel(1, 'Sofia Martinez')
    await eventsApi.uncancel(1, 'Sofia Martinez')
    await eventsApi.update(1, eventInput, 'Sofia Martinez')
    await eventsApi.create(createInput, 'Sofia Martinez')

    expect(requestMock).toHaveBeenNthCalledWith(1, '/events/1/cancel', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer Sofia Martinez',
      },
    })
    expect(requestMock).toHaveBeenNthCalledWith(2, '/events/1/uncancel', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer Sofia Martinez',
      },
    })
    expect(requestMock).toHaveBeenNthCalledWith(3, '/events/1', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer Sofia Martinez',
      },
      body: JSON.stringify(eventInput),
    })
    expect(requestMock).toHaveBeenNthCalledWith(4, '/events', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer Sofia Martinez',
      },
      body: JSON.stringify(createInput),
    })
  })

  it('requests authenticated location updates', async () => {
    const locationInput: UpdateLocationInput = {
      name: 'New venue',
      address: 'New Street 42',
      country: 'DE',
      city: 'Berlin',
      postal_code: null,
    }

    await eventsApi.updateLocation(1, locationInput, 'Sofia Martinez')

    expect(requestMock).toHaveBeenCalledWith('/locations/1', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer Sofia Martinez',
      },
      body: JSON.stringify(locationInput),
    })
  })

  it('builds same-origin and configured WebSocket URLs', () => {
    expect(eventsApi.getWebSocketUrl()).toBe(
      `ws://${window.location.host}/ws/events`,
    )

    vi.stubEnv('VITE_WS_BASE_URL', 'wss://events.example.com')
    expect(eventsApi.getWebSocketUrl()).toBe('wss://events.example.com/ws/events')

    vi.stubEnv('VITE_WS_BASE_URL', 'wss://events.example.com/ws/events/')
    expect(eventsApi.getWebSocketUrl()).toBe('wss://events.example.com/ws/events')
  })
})
