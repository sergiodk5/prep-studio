import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { httpClient } from '@/api/http'
import { createCourseHandlers } from '@/mocks/courses'
import { createMockDb } from '@/mocks/db'
import { createLessonHandlers } from '@/mocks/lessons'

const server = setupServer()

function createCourse() {
  return httpClient.createCourse({ title: 'Technical screen', track: 'technical', description: '' })
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  localStorage.clear()
  const db = createMockDb(localStorage)
  server.use(...createCourseHandlers(db), ...createLessonHandlers(db))
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('lesson handlers', () => {
  it('adds new lessons to the end of the course outline', async () => {
    const course = await createCourse()
    const first = await httpClient.createLesson(course.id, { title: 'First' })
    const second = await httpClient.createLesson(course.id, { title: '  Second  ' })

    expect(second).toMatchObject({ courseId: course.id, title: 'Second', position: 1, version: 1 })
    await expect(httpClient.getCourse(course.id)).resolves.toMatchObject({
      outline: [
        { lessonId: first.id, title: 'First', position: 0 },
        { lessonId: second.id, title: 'Second', position: 1 },
      ],
      version: course.version,
    })
  })

  it('returns 404 when the course does not exist', async () => {
    await expect(httpClient.createLesson('missing', { title: 'First' })).rejects.toMatchObject({
      status: 404,
    })
  })

  it('rejects an invalid lesson with 422 and keeps the outline empty', async () => {
    const course = await createCourse()

    await expect(httpClient.createLesson(course.id, { title: '   ' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { title: ['Title is required'] },
    })
    await expect(httpClient.getCourse(course.id)).resolves.toMatchObject({ outline: [] })
  })

  it('renames a lesson and its outline entry', async () => {
    const course = await createCourse()
    const lesson = await httpClient.createLesson(course.id, { title: 'First' })

    await httpClient.updateLesson(lesson.id, { title: '  Renamed  ' }, lesson.version)

    await expect(httpClient.getLesson(lesson.id)).resolves.toMatchObject({
      title: 'Renamed',
      version: 2,
    })
    await expect(httpClient.getCourse(course.id)).resolves.toMatchObject({
      outline: [{ lessonId: lesson.id, title: 'Renamed' }],
    })
  })

  it('rejects a stale version with 409 and the current lesson', async () => {
    const course = await createCourse()
    const lesson = await httpClient.createLesson(course.id, { title: 'First' })
    await httpClient.updateLesson(lesson.id, { notes: 'Mine' }, lesson.version)

    await expect(
      httpClient.updateLesson(lesson.id, { notes: 'Theirs' }, lesson.version),
    ).rejects.toMatchObject({ status: 409, current: { notes: 'Mine', version: 2 } })
  })

  it('removes a deleted lesson from the outline and renumbers the rest', async () => {
    const course = await createCourse()
    const first = await httpClient.createLesson(course.id, { title: 'First' })
    const second = await httpClient.createLesson(course.id, { title: 'Second' })

    await httpClient.deleteLesson(first.id)

    await expect(httpClient.getLesson(first.id)).rejects.toMatchObject({ status: 404 })
    await expect(httpClient.getCourse(course.id)).resolves.toMatchObject({
      outline: [{ lessonId: second.id, position: 0 }],
    })
  })

  it('deletes the lessons of a deleted course', async () => {
    const course = await createCourse()
    const lesson = await httpClient.createLesson(course.id, { title: 'First' })

    await httpClient.deleteCourse(course.id)

    await expect(httpClient.getLesson(lesson.id)).rejects.toMatchObject({ status: 404 })
  })
})
