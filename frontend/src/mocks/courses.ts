import { http, HttpResponse } from 'msw/http'

import type { CourseChanges, NewCourse } from '@/api/client'
import type { Course } from '@/domain/types'
import type { MockDb } from '@/mocks/db'

export function createCourseHandlers(db: MockDb) {
  return [
    http.get('/api/courses', () => HttpResponse.json(db.listCourses())),

    http.get<{ id: string }>('/api/courses/:id', ({ params }) => {
      const course = db.findCourse(params.id)
      return course ? HttpResponse.json(course) : notFound()
    }),

    http.post<never, NewCourse>('/api/courses', async ({ request }) => {
      const input = await request.json()
      const course: Course = {
        id: crypto.randomUUID(),
        ...input,
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
        const result = db.updateCourse(params.id, changes, version)

        switch (result.kind) {
          case 'ok':
            return HttpResponse.json(result.course)
          case 'not-found':
            return notFound()
          case 'conflict':
            return HttpResponse.json(
              { message: 'This course was changed by someone else', current: result.current },
              { status: 409 },
            )
        }
      },
    ),

    http.delete<{ id: string }>('/api/courses/:id', ({ params }) => {
      const deleted = db.deleteCourse(params.id)

      if (!deleted) return notFound()

      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

function notFound() {
  return HttpResponse.json({ message: 'Course not found' }, { status: 404 })
}
