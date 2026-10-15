import type { ApiClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { apiClientKey } from '@/api/injection'
import type { Course, Id, Lesson, OutlineEntry } from '@/domain/types'
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

describe('outline store lesson actions', () => {
  function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
    return {
      id: 'l1',
      courseId: 'c1',
      title: 'First',
      position: 0,
      notes: '',
      tags: [],
      items: [],
      version: 3,
      lock: null,
      updatedAt: '2026-10-15T09:00:00.000Z',
      ...overrides,
    }
  }

  async function setupLoaded(api: Partial<ApiClient>, outline: OutlineEntry[] = []) {
    const store = setupStore({ getCourse: async (id) => ({ ...makeCourse(id), outline }), ...api })
    await store.load('c1')
    return store
  }

  const first: OutlineEntry = { lessonId: 'l1', title: 'First', position: 0 }
  const second: OutlineEntry = { lessonId: 'l2', title: 'Second', position: 1 }

  it('adds the lesson returned by the server to the end of the outline', async () => {
    const store = await setupLoaded(
      { createLesson: async () => makeLesson({ id: 'l2', title: 'Second', position: 1 }) },
      [first],
    )

    await store.addLesson({ title: 'Second' })

    expect(store.course?.outline).toEqual([first, second])
  })

  it('renames with the current lesson version and updates the outline title', async () => {
    const sentVersions: number[] = []
    const store = await setupLoaded(
      {
        getLesson: async () => makeLesson({ version: 3 }),
        updateLesson: async (_id, _changes, version) => {
          sentVersions.push(version)
          return makeLesson({ title: 'Renamed', version: 4 })
        },
      },
      [first],
    )

    await store.renameLesson('l1', 'Renamed')

    expect(sentVersions).toEqual([3])
    expect(store.course?.outline).toEqual([{ ...first, title: 'Renamed' }])
  })

  it('removes a lesson the server no longer has when renaming and rethrows', async () => {
    const notFound = new ApiError(404, 'Lesson not found')
    const store = await setupLoaded(
      {
        getLesson: async () => {
          throw notFound
        },
      },
      [first, second],
    )

    await expect(store.renameLesson('l1', 'Renamed')).rejects.toBe(notFound)

    expect(store.course?.outline).toEqual([{ ...second, position: 0 }])
  })

  it('treats a 404 on delete as deleted and renumbers the rest', async () => {
    const store = await setupLoaded(
      {
        deleteLesson: async () => {
          throw new ApiError(404, 'Lesson not found')
        },
      },
      [first, second],
    )

    await store.deleteLesson('l1')

    expect(store.course?.outline).toEqual([{ ...second, position: 0 }])
  })

  it('keeps the lesson and rethrows when delete fails', async () => {
    const failure = new ApiError(500, 'Server error')
    const store = await setupLoaded(
      {
        deleteLesson: async () => {
          throw failure
        },
      },
      [first],
    )

    await expect(store.deleteLesson('l1')).rejects.toBe(failure)

    expect(store.course?.outline).toEqual([first])
  })
})
