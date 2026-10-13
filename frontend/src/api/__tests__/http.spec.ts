import { http, HttpResponse } from 'msw/http'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { httpClient } from '@/api/http'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('httpClient', () => {
  it('returns the parsed body on success', async () => {
    const courses = [{ id: 'c1' }]
    server.use(http.get('/api/courses', () => HttpResponse.json(courses)))

    await expect(httpClient.listCourses()).resolves.toEqual(courses)
  })

  it('throws an ApiError with the server message on a HTTP error', async () => {
    server.use(
      http.get('/api/courses/c1', () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 }),
      ),
    )

    await expect(httpClient.getCourse('c1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Not found',
    })
  })

  it('throws status 0 when the network fails', async () => {
    server.use(http.get('/api/courses', () => HttpResponse.error()))

    await expect(httpClient.listCourses()).rejects.toMatchObject({ name: 'ApiError', status: 0 })
  })

  it('rejects a successful response that is not JSON', async () => {
    server.use(http.get('/api/courses', () => HttpResponse.html('<!DOCTYPE html>')))

    await expect(httpClient.listCourses()).rejects.toMatchObject({
      status: 200,
      message: 'Expected a JSON response',
    })
  })

  it('rethrows the AbortError when the request is cancelled', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(httpClient.listCourses({ signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    })
  })

  it('sends the changes together with the version on update', async () => {
    let sentBody: unknown

    server.use(
      http.patch('/api/courses/c1', async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ id: 'c1' })
      }),
    )

    await httpClient.updateCourse('c1', { title: 'New' }, 3)

    expect(sentBody).toEqual({ title: 'New', version: 3 })
  })
})
