import { http, HttpResponse } from 'msw/http'

import type { CourseChanges, NewCourse } from '@/api/client'
import type { Course } from '@/domain/types'
import { hasErrors, validateCourse } from '@/domain/validation'
import type { MockDb } from '@/mocks/db'
import { conflict, notFound, unprocessable } from '@/mocks/responses'

export function createCourseHandlers(db: MockDb) {
  return [
    http.get('/api/courses', () => HttpResponse.json(db.listCourses())),

    http.get<{ id: string }>('/api/courses/:id', ({ params }) => {
      const course = db.findCourse(params.id)
      return course ? HttpResponse.json(course) : notFound('Course not found')
    }),

    http.post<never, NewCourse>('/api/courses', async ({ request }) => {
      const input = await request.json()
      const errors = validateCourse(input, 'create')

      if (hasErrors(errors)) return unprocessable(errors)

      const course: Course = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        track: input.track,
        description: input.description ?? '',
        outline: [],
        version: 1,
        updatedAt: new Date().toISOString(),
      }
      db.insertCourse(course)
      return HttpResponse.json(course, { status: 201 })
    }),

    http.patch<{ id: string }, CourseChanges & { version: number }>(
      '/api/courses/:id',
      async ({ params, request }) => {
        const { version, ...changes } = await request.json()
        const errors = validateCourse(changes, 'update')

        if (hasErrors(errors)) return unprocessable(errors)
        if (typeof changes.title === 'string') changes.title = changes.title.trim()

        const result = db.updateCourse(params.id, changes, version)

        switch (result.kind) {
          case 'ok':
            return HttpResponse.json(result.value)
          case 'not-found':
            return notFound('Course not found')
          case 'conflict':
            return conflict('This course was changed by someone else', result.current)
        }
      },
    ),

    http.delete<{ id: string }>('/api/courses/:id', ({ params }) => {
      const deleted = db.deleteCourse(params.id)

      if (!deleted) return notFound('Course not found')

      return new HttpResponse(null, { status: 204 })
    }),
  ]
}
