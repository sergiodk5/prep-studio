import type { ApiClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { apiClientKey } from '@/api/injection'
import type { Course, Id } from '@/domain/types'
import { useOutlineStore } from '@/stores/outline'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createApp } from 'vue'

function setupStore(api: Partial<ApiClient>) {
  const pinia = createPinia()
  createApp({})
    .provide(apiClientKey, api as ApiClient)
    .use(pinia)
  setActivePinia(pinia)
  return useOutlineStore()
}

function makeCourse(id: Id): Course {
  return {
    id,
    title: `Course ${id}`,
    track: 'technical',
    description: '',
    outline: [],
    version: 1,
    updatedAt: '2026-10-15T09:00:00.000Z',
  }
}

function controlledApi() {
  const pending = new Map<Id, (course: Course) => void>()
  const api: Partial<ApiClient> = {
    getCourse: (id) => new Promise((resolve) => pending.set(id, resolve)),
  }
  const finish = (id: Id) => pending.get(id)?.(makeCourse(id))
  return { api, finish }
}

describe('outline store', () => {
  it('clears the previous course while a different one loads', async () => {
    const { api, finish } = controlledApi()
    const store = setupStore(api)
    const first = store.load('a')
    finish('a')
    await first

    const second = store.load('b')

    expect(store.course).toBeNull()
    expect(store.status).toBe('loading')
    finish('b')
    await second
    expect(store.course?.id).toBe('b')
  })

  it('keeps the latest course when an older request finishes last', async () => {
    const { api, finish } = controlledApi()
    const store = setupStore(api)

    const first = store.load('a')
    const second = store.load('b')
    finish('b')
    await second
    finish('a')
    await first

    expect(store.course?.id).toBe('b')
    expect(store.status).toBe('ready')
  })

  it('keeps the ApiError when the course cannot be loaded', async () => {
    const store = setupStore({
      getCourse: async () => {
        throw new ApiError(404, 'Course not found')
      },
    })

    await store.load('missing')

    expect(store.status).toBe('error')
    expect(store.error?.status).toBe(404)
  })
})
