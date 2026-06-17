import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createHttpClient} from '@/shared/http/http-client.ts'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    headers: new Headers({'content-type': 'application/json'}),
    json: vi.fn<() => Promise<unknown>>().mockResolvedValue(body),
    text: vi.fn<() => Promise<string>>().mockResolvedValue(String(body)),
  } as unknown as Response
}

function emptyResponse(status = 204): Response {
  return {
    ok: true,
    status,
    headers: new Headers(),
    json: vi.fn<() => Promise<unknown>>(),
    text: vi.fn<() => Promise<string>>(),
  } as unknown as Response
}

function invalidJsonResponse(status = 500): Response {
  return {
    ok: false,
    status,
    headers: new Headers({'content-type': 'application/json'}),
    json: vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error('Invalid JSON')),
    text: vi.fn<() => Promise<string>>(),
  } as unknown as Response
}

describe('http-client', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    })
  })

  it('builds URLs with normalized paths and repeated query parameters', async () => {
    const client = createHttpClient('/api/')
    fetchMock.mockResolvedValueOnce(jsonResponse({ok: true}))

    await expect(
      client.request('/joiners', {
        query: {
          event_ids: [1, 2],
          include_inactive: false,
          page: 3,
        },
      }),
    ).resolves.toEqual({ok: true})

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/joiners?event_ids=1&event_ids=2&include_inactive=false&page=3',
      expect.objectContaining({headers: expect.any(Headers)}),
    )
  })

  it('adds JSON content type only when a body is present', async () => {
    const client = createHttpClient('/api')
    fetchMock.mockResolvedValueOnce(jsonResponse({id: 1}))

    await client.request('/events', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer Sofia Martinez',
      },
      body: JSON.stringify({title: 'Dinner'}),
    })

    const headers = fetchMock.mock.calls[0][1]?.headers as Headers

    expect(headers.get('Authorization')).toBe('Bearer Sofia Martinez')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('returns null for empty 204 responses', async () => {
    const client = createHttpClient('/api')
    fetchMock.mockResolvedValueOnce(emptyResponse())

    await expect(client.request<null>('/events/1')).resolves.toBeNull()
  })

  it('uses string error details from API responses', async () => {
    const client = createHttpClient('/api')
    fetchMock.mockResolvedValueOnce(jsonResponse({detail: 'Already joined'}, false, 409))

    await expect(client.request('/events')).rejects.toThrow('Already joined')
  })

  it('uses validation error messages from API detail arrays', async () => {
    const client = createHttpClient('/api')
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          detail: [{msg: 'Duration must be greater than 0'}],
        },
        false,
        422,
      ),
    )

    await expect(client.request('/events')).rejects.toThrow(
      'Duration must be greater than 0',
    )
  })

  it('falls back to the HTTP status when the error body cannot be parsed', async () => {
    const client = createHttpClient('/api')
    fetchMock.mockResolvedValueOnce(invalidJsonResponse(500))

    await expect(client.request('/events')).rejects.toThrow('Request failed (500).')
  })
})
