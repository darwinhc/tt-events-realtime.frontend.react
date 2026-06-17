export interface HttpRequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | Array<string | number | boolean>>
}

function buildUrl(baseUrl: string, path: string, query?: HttpRequestOptions['query']) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${normalizedBaseUrl}${normalizedPath}`

  if (!query) {
    return url
  }

  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        searchParams.append(key, String(item))
      })
      return
    }

    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()

  return queryString ? `${url}?${queryString}` : url
}

function getErrorMessage(body: unknown, status: number) {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = body.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (!item || typeof item !== 'object' || !('msg' in item)) {
            return null
          }

          return typeof item.msg === 'string' ? item.msg : null
        })
        .filter((message): message is string => Boolean(message))

      if (messages.length > 0) {
        return messages.join(', ')
      }
    }
  }

  return `Request failed (${status}).`
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')

  if (response.status === 204) {
    return null
  }

  if (contentType?.includes('application/json')) {
    return response.json().catch(() => null)
  }

  return response.text()
}

export function createHttpClient(baseUrl: string) {
  async function request<T>(
    path: string,
    options: HttpRequestOptions = {},
  ): Promise<T> {
    const {query, headers: requestHeaders, ...requestOptions} = options

    const headers = new Headers(requestHeaders)

    if (!headers.has('Content-Type') && requestOptions.body !== undefined) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(buildUrl(baseUrl, path, query), {
      ...requestOptions,
      headers,
    })

    const body = await parseResponseBody(response)

    if (!response.ok) {
      throw new Error(getErrorMessage(body, response.status))
    }

    return body as T
  }

  return {
    request,
  }
}