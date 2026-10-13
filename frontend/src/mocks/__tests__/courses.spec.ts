import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NewCourse } from '@/api/client'
import { httpClient } from '@/api/http'
import { createCourseHandlers } from '@/mocks/courses'
import { createMockDb } from '@/mocks/db'

const server = setupServer()
const input: NewCourse = { title: 'Technical screen', track: 'technical', description: '' }

function startMockBackend() {
  server.use(...createCourseHandlers(createMockDb(localStorage)))
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  localStorage.clear()
  startMockBackend()
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('course handlers', () => {
  it('creates a course with server-owned fields', async () => {
    const created = await httpClient.createCourse(input)

    expect(created).toMatchObject({ ...input, outline: [], version: 1 })
    expect(created.id).toEqual(expect.any(String))
    await expect(httpClient.listCourses()).resolves.toEqual([created])
  })

  it('rejects a stale version with 409 and the current course', async () => {
    const created = await httpClient.createCourse(input)
    await httpClient.updateCourse(created.id, { title: 'First edit' }, created.version)

    await expect(
      httpClient.updateCourse(created.id, { title: 'Second edit' }, created.version),
    ).rejects.toMatchObject({ status: 409, current: { title: 'First edit', version: 2 } })
  })

  it('returns 404 for an uknown course', async () => {
    await expect(httpClient.getCourse('missing')).rejects.toMatchObject({ status: 404 })
  })

  it('keeps data across a relead', async () => {
    const created = await httpClient.createCourse(input)

    server.resetHandlers()
    startMockBackend()

    await expect(httpClient.getCourse(created.id)).resolves.toEqual(created)
  })

  it('deletes a course and returns 404 when requesting again', async () => {
    const course = await httpClient.createCourse(input)

    await httpClient.deleteCourse(course.id)

    await expect(httpClient.getCourse(course.id)).rejects.toMatchObject({ status: 404 })
    await expect(httpClient.deleteCourse(course.id)).rejects.toMatchObject({ status: 404 })
  })
})
