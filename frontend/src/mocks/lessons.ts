import { http, HttpResponse } from 'msw/http'

import type { LessonChanges, NewLesson } from '@/api/client'
import { hasErrors, validateLesson } from '@/domain/validation'
import type { MockDb } from '@/mocks/db'
import { conflict, notFound, unprocessable } from '@/mocks/responses'

export function createLessonHandlers(db: MockDb) {
  return [
    http.get<{ id: string }>('/api/lessons/:id', ({ params }) => {
      const lesson = db.findLesson(params.id)
      return lesson ? HttpResponse.json(lesson) : notFound('Lesson not found')
    }),

    http.post<{ id: string }, NewLesson>(
      '/api/courses/:id/lessons',
      async ({ params, request }) => {
        const input = await request.json()
        const errors = validateLesson(input, 'create')

        if (hasErrors(errors)) return unprocessable(errors)

        const lesson = db.insertLesson(params.id, {
          id: crypto.randomUUID(),
          title: input.title.trim(),
          notes: '',
          tags: [],
          items: [],
          version: 1,
          lock: null,
          updatedAt: new Date().toISOString(),
        })
        return lesson ? HttpResponse.json(lesson, { status: 201 }) : notFound('Course not found')
      },
    ),

    http.patch<{ id: string }, LessonChanges & { version: number }>(
      '/api/lessons/:id',
      async ({ params, request }) => {
        const { version, ...changes } = await request.json()
        const errors = validateLesson(changes, 'update')

        if (hasErrors(errors)) return unprocessable(errors)
        if (typeof changes.title === 'string') changes.title = changes.title.trim()

        const result = db.updateLesson(params.id, changes, version)

        switch (result.kind) {
          case 'ok':
            return HttpResponse.json(result.value)
          case 'not-found':
            return notFound('Lesson not found')
          case 'conflict':
            return conflict('This lesson was changed by someone else', result.current)
        }
      },
    ),

    http.delete<{ id: string }>('/api/lessons/:id', ({ params }) => {
      const deleted = db.deleteLesson(params.id)

      if (!deleted) return notFound('Lesson not found')

      return new HttpResponse(null, { status: 204 })
    }),
  ]
}
