import type { ApiClient, RequestOptions } from '@/api/client'
import { ApiError, toApiError } from '@/api/errors'

const BASE_URL = '/api'

async function request<T>(
  method: string,
  path: string,
  { body, signal }: RequestOptions & { body?: unknown } = {},
): Promise<T> {
  const response = await send(method, path, body, signal)
  const data = await readBody(response)

  if (!response.ok) throw toApiError(response.status, data)
  if (typeof data === 'string') throw new ApiError(response.status, 'Expected a JSON response')

  return data as T
}

async function send(method: string, path: string, body: unknown, signal?: AbortSignal) {
  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(0, 'Could not reach the server')
  }
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined

  const isJson = response.headers.get('Content-Type')?.includes('application/json')
  return isJson ? response.json() : response.text()
}

export const httpClient: ApiClient = {
  listCourses: (options) => request('GET', '/courses', options),
  createCourse: (input) => request('POST', '/courses', { body: input }),
  getCourse: (id, options) => request('GET', `/courses/${encodeURIComponent(id)}`, options),
  updateCourse: (id, changes, version) =>
    request('PATCH', `/courses/${encodeURIComponent(id)}`, { body: { ...changes, version } }),
  deleteCourse: (id) => request('DELETE', `/courses/${encodeURIComponent(id)}`),
}
