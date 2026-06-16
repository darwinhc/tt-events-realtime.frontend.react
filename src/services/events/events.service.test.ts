import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  CreateEventInput,
  UpdateLocationInput,
  UpdateEventInput,
} from '@/domains/events/types/event.types'
import { eventsService } from '@/services/events/events.service'
import { activeEvent, currentUser, joiner } from '@/test/fixtures'

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn<() => Promise<unknown>>().mockResolvedValue(body),
  } as unknown as Response
}

describe('eventsService', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    })
  })

  it('loads events and joiners', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([activeEvent]))
      .mockResolvedValueOnce(jsonResponse([joiner]))

    await expect(eventsService.getEvents()).resolves.toEqual([activeEvent])
    await expect(eventsService.getJoiners(1)).resolves.toEqual([joiner])
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/events',
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/events/1/joiners',
      expect.any(Object),
    )
  })

  it('sends authenticated event and attendance mutations', async () => {
    const input: CreateEventInput = {
      title: 'Dinner',
      scheduled_at: '2026-08-15T17:00:00.000Z',
      duration_in_minutes: 120,
      location: {
        name: 'Garden Hall',
        address: 'Main Street 1',
        country: 'DE',
        city: 'Berlin',
        postal_code: null,
      },
    }
    const update: UpdateEventInput = {
      title: 'Updated dinner',
      scheduled_at: '2026-08-15T18:00:00.000Z',
      duration_in_minutes: 90,
    }
    const locationUpdate: UpdateLocationInput = {
      name: 'New venue',
      address: 'New Street 42',
      country: 'CO',
      city: 'Bogota',
      postal_code: '110111',
    }
    fetchMock.mockResolvedValue(jsonResponse(joiner))

    await eventsService.join(1, currentUser.name)
    await eventsService.leave(1, 'Sofia Martinez')
    await eventsService.cancel(1, currentUser.name)
    await eventsService.uncancel(1, currentUser.name)
    await eventsService.update(1, update, currentUser.name)
    await eventsService.updateLocation(1, locationUpdate, currentUser.name)
    await eventsService.create(input, currentUser.name)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/joiners',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
        body: JSON.stringify({ event_id: 1 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/joiners/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.any(Headers),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/events/1/cancel',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/api/events/1/uncancel',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      '/api/events/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.any(Headers),
        body: JSON.stringify(update),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      '/api/locations/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.any(Headers),
        body: JSON.stringify(locationUpdate),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      7,
      '/api/events',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
        body: JSON.stringify(input),
      }),
    )

    for (const callNumber of [1, 2, 3, 4, 5, 6, 7]) {
      const headers = fetchMock.mock.calls[callNumber - 1][1]?.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer Sofia Martinez')
      expect(headers.get('Content-Type')).toBe('application/json')
    }
  })

  it('uses API error detail and status fallbacks', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'Already joined' }, false, 409))
      .mockResolvedValueOnce(
        jsonResponse(
          { detail: [{ msg: 'Duration must be positive' }] },
          false,
          422,
        ),
      )
      .mockResolvedValueOnce(
        {
          ok: false,
          status: 500,
          json: vi
            .fn<() => Promise<unknown>>()
            .mockRejectedValue(new Error('invalid json')),
        } as unknown as Response,
      )

    await expect(eventsService.getEvents()).rejects.toThrow('Already joined')
    await expect(eventsService.getEvents()).rejects.toThrow(
      'Duration must be positive',
    )
    await expect(eventsService.getEvents()).rejects.toThrow(
      'Request failed (500).',
    )
  })

  it('builds same-origin WebSocket URLs', () => {
    expect(eventsService.getWebSocketUrl()).toBe(
      `ws://${window.location.host}/ws/events`,
    )
  })

  it('uses a configured WebSocket URL without duplicating the event path', () => {
    vi.stubEnv('VITE_WS_URL', 'wss://events.example.com')
    expect(eventsService.getWebSocketUrl()).toBe(
      'wss://events.example.com/ws/events',
    )

    vi.stubEnv('VITE_WS_URL', 'wss://events.example.com/ws/events/')
    expect(eventsService.getWebSocketUrl()).toBe(
      'wss://events.example.com/ws/events',
    )
  })
})
