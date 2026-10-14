import type { ApiClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { apiClientKey } from '@/api/injection'
import type { Course } from '@/domain/types'
import { useCourseStore } from '@/stores/course'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createApp } from 'vue'

function setupStore(api: Partial<ApiClient>) {
  const pinia = createPinia()
  createApp({})
    .provide(apiClientKey, api as ApiClient)
    .use(pinia)
  setActivePinia(pinia)
  return useCourseStore()
}

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    title: 'Technical screen',
    track: 'technical',
    description: '',
    outline: [],
    version: 1,
    updatedAt: '2026-10-13T09:00:00.000Z',
    ...overrides,
  }
}

describe('course store', () => {
  it('stores the loaded courses and becomes ready', async () => {
    const course = makeCourse()
    const store = setupStore({ listCourses: async () => [course] })

    await store.loadCourses()

    expect(store.status).toBe('ready')
    expect(store.courses).toEqual([course])
    expect(store.isEmpty).toBe(false)
  })

  it('is not empty while loading, only once loaded with no courses', async () => {
    let resolve!: (courses: Course[]) => void
    const store = setupStore({ listCourses: () => new Promise((r) => (resolve = r)) })

    const loading = store.loadCourses()
    expect(store.status).toBe('loading')
    expect(store.isEmpty).toBe(false)

    resolve([])
    await loading
    expect(store.isEmpty).toBe(true)
  })

  it('keeps the ApiError when loading fails', async () => {
    const store = setupStore({
      listCourses: async () => {
        throw new ApiError(500, 'Server error')
      },
    })

    await store.loadCourses()

    expect(store.status).toBe('error')
    expect(store.error).toMatchObject({ status: 500, message: 'Server error' })
  })

  it('rethrows unexpected errors without showing them as an api error', async () => {
    const store = setupStore({
      listCourses: async () => {
        throw new TypeError('Cannot read properties of undefined')
      },
    })

    await expect(store.loadCourses()).rejects.toThrow(TypeError)

    expect(store.status).toBe('error')
    expect(store.error).toBeNull()
  })

  it('adds the course returned by the server', async () => {
    const created = makeCourse({ id: 'new' })
    const store = setupStore({
      listCourses: async () => [],
      createCourse: async () => created,
    })
    await store.loadCourses()

    await store.createCourse({ title: 'Technical screen', track: 'technical', description: '' })

    expect(store.courses).toEqual([created])
    expect(store.isEmpty).toBe(false)
  })

  it('leaves the store untouched when the server rejects the course', async () => {
    const existing = makeCourse()
    const rejection = new ApiError(422, 'Invalid', {
      fieldErrors: { title: ['Title is required'] },
    })
    const store = setupStore({
      listCourses: async () => [existing],
      createCourse: async () => {
        throw rejection
      },
    })
    await store.loadCourses()

    await expect(
      store.createCourse({ title: '', track: 'technical', description: '' }),
    ).rejects.toBe(rejection)

    expect(store.courses).toEqual([existing])
    expect(store.error).toBeNull()
  })
})
