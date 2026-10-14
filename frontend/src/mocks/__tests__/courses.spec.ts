import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NewCourse } from '@/api/client'
import { httpClient } from '@/api/http'
import { createCourseHandlers } from '@/mocks/courses'
import type { MockData } from '@/mocks/db'
import { createMockDb } from '@/mocks/db'
import { seedData } from '@/mocks/seed'

const server = setupServer()
const input: NewCourse = { title: 'Technical screen', track: 'technical', description: '' }

function startMockBackend(initial?: MockData) {
  server.use(...createCourseHandlers(createMockDb(localStorage, initial)))
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

  it('returns 404 for an unknown course', async () => {
    await expect(httpClient.getCourse('missing')).rejects.toMatchObject({ status: 404 })
  })

  it('keeps data across a reload', async () => {
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

  it('stores a trimmed title on create', async () => {
    const created = await httpClient.createCourse({ ...input, title: '  Technical screen  ' })

    expect(created.title).toBe('Technical screen')
  })

  it('rejects an invalid new course with 422 and stores nothing', async () => {
    await expect(httpClient.createCourse({ ...input, title: '   ' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { title: ['Title is required'] },
    })
    await expect(httpClient.listCourses()).resolves.toEqual([])
  })

  it('rejects an invalid update with 422 and keeps the course unchanged', async () => {
    const created = await httpClient.createCourse(input)

    await expect(
      httpClient.updateCourse(created.id, { title: '   ' }, created.version),
    ).rejects.toMatchObject({ status: 422, fieldErrors: { title: ['Title is required'] } })
    await expect(httpClient.getCourse(created.id)).resolves.toEqual(created)
  })

  it('stores a trimmed title on update without touching other fields', async () => {
    const created = await httpClient.createCourse(input)

    const updated = await httpClient.updateCourse(
      created.id,
      { title: '  Renamed  ' },
      created.version,
    )

    expect(updated).toMatchObject({ title: 'Renamed', track: input.track, version: 2 })
  })

  describe('with seed data', () => {
    beforeEach(() => {
      server.resetHandlers()
      startMockBackend(seedData)
    })

    it('seeds an empty storage', async () => {
      await expect(httpClient.listCourses()).resolves.toEqual(seedData.courses)
    })

    it('does not re-seed after every course is deleted', async () => {
      for (const course of seedData.courses) await httpClient.deleteCourse(course.id)

      server.resetHandlers()
      startMockBackend(seedData)

      await expect(httpClient.listCourses()).resolves.toEqual([])
    })

    it('restores the full seed when storage is cleared', async () => {
      await httpClient.deleteCourse('seed-technical')

      localStorage.clear()
      server.resetHandlers()
      startMockBackend(seedData)

      await expect(httpClient.listCourses()).resolves.toHaveLength(5)
    })
  })
})
