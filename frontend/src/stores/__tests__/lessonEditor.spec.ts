import type { ApiClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { apiClientKey } from '@/api/injection'
import type { Id, Lesson } from '@/domain/types'
import { useLessonEditorStore } from '@/stores/lessonEditor'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createApp } from 'vue'

function setupStore(api: Partial<ApiClient>) {
  const pinia = createPinia()
  createApp({})
    .provide(apiClientKey, api as ApiClient)
    .use(pinia)
  setActivePinia(pinia)
  return useLessonEditorStore()
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'l1',
    courseId: 'c1',
    title: 'Vue state',
    position: 0,
    notes: 'Stores by domain',
    tags: [],
    items: [],
    version: 3,
    lock: null,
    updatedAt: '2026-10-15T09:00:00.000Z',
    ...overrides,
  }
}

async function setupLoaded(api: Partial<ApiClient>, lesson = makeLesson()) {
  const store = setupStore({ getLesson: async () => lesson, ...api })
  await store.load(lesson.id)
  return store
}

describe('lesson editor store', () => {
  it('fills the draft from the loaded lesson and tracks changes', async () => {
    const store = await setupLoaded({})

    expect(store.draft).toEqual({ title: 'Vue state', notes: 'Stores by domain' })
    expect(store.isDirty).toBe(false)

    store.draft.notes = 'Stores by domain, not by page'

    expect(store.isDirty).toBe(true)
  })

  it('ignores an older lesson that finishes loading last', async () => {
    const pending = new Map<Id, (lesson: Lesson) => void>()
    const store = setupStore({
      getLesson: (id) => new Promise((resolve) => pending.set(id, resolve)),
    })

    const first = store.load('a')
    const second = store.load('b')
    pending.get('b')?.(makeLesson({ id: 'b', title: 'B' }))
    await second
    pending.get('a')?.(makeLesson({ id: 'a', title: 'A' }))
    await first

    expect(store.lesson?.id).toBe('b')
    expect(store.draft.title).toBe('B')
  })

  it('saves the draft with the loaded version and takes the saved title', async () => {
    const sent: { changes: object; version: number }[] = []
    const store = await setupLoaded({
      updateLesson: async (_id, changes, version) => {
        sent.push({ changes, version })
        return makeLesson({ title: 'Renamed', notes: 'New notes', version: 4 })
      },
    })
    store.draft = { title: '  Renamed  ', notes: 'New notes' }

    await store.save()

    expect(sent).toEqual([{ changes: { title: '  Renamed  ', notes: 'New notes' }, version: 3 }])
    expect(store.lesson?.version).toBe(4)
    expect(store.draft.title).toBe('Renamed')
    expect(store.isDirty).toBe(false)
  })

  it('keeps what the user typed while the save was running', async () => {
    let finish!: (lesson: Lesson) => void
    const store = await setupLoaded({
      updateLesson: () => new Promise((resolve) => (finish = resolve)),
    })
    store.draft.title = 'First'

    const saving = store.save()
    store.draft.title = 'First and second'
    finish(makeLesson({ title: 'First', version: 4 }))
    await saving

    expect(store.draft.title).toBe('First and second')
    expect(store.isDirty).toBe(true)
  })

  it('keeps my draft and takes their lesson on a 409', async () => {
    const theirs = makeLesson({ notes: 'Their notes', version: 4 })
    const conflict = new ApiError(409, 'Changed', { current: theirs })
    const store = await setupLoaded({
      updateLesson: async () => {
        throw conflict
      },
    })
    store.draft.notes = 'My notes'

    await expect(store.save()).rejects.toBe(conflict)

    expect(store.lesson).toEqual(theirs)
    expect(store.draft.notes).toBe('My notes')
  })
})
