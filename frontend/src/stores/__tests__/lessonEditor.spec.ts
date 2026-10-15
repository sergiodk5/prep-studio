import type { ApiClient, LessonChanges } from '@/api/client'
import { ApiError } from '@/api/errors'
import { apiClientKey } from '@/api/injection'
import type { Id, Lesson } from '@/domain/types'
import { AUTOSAVE_DELAY_MS, useLessonEditorStore } from '@/stores/lessonEditor'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

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

function recordingUpdate(respond: (version: number) => Promise<Lesson>) {
  const calls: { changes: LessonChanges; version: number }[] = []
  const updateLesson: ApiClient['updateLesson'] = (_id, changes, version) => {
    calls.push({ changes, version })
    return respond(version)
  }
  return { calls, updateLesson }
}

async function typeNotes(store: ReturnType<typeof useLessonEditorStore>, notes: string) {
  store.draft.notes = notes
  await nextTick()
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
    const { calls, updateLesson } = recordingUpdate(async () =>
      makeLesson({ title: 'Renamed', notes: 'New notes', version: 4 }),
    )
    const store = await setupLoaded({ updateLesson })
    store.draft = { title: '  Renamed  ', notes: 'New notes' }

    await store.save()

    expect(calls).toEqual([{ changes: { title: '  Renamed  ', notes: 'New notes' }, version: 3 }])
    expect(store.saveState).toBe('saved')
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

  it('does not send an invalid title', async () => {
    const { calls, updateLesson } = recordingUpdate(async () => makeLesson())
    const store = await setupLoaded({ updateLesson })
    store.draft.title = '   '

    await store.save()

    expect(calls).toEqual([])
    expect(store.saveState).toBe('idle')
  })

  it('keeps the draft and shows failed when the save fails', async () => {
    const failure = new ApiError(500, 'Server error')
    const store = await setupLoaded({
      updateLesson: async () => {
        throw failure
      },
    })
    store.draft.notes = 'My notes'

    await store.save()

    expect(store.saveState).toBe('failed')
    expect(store.saveError).toBe(failure)
    expect(store.draft.notes).toBe('My notes')
  })

  it('ignores a save that finishes after another lesson was opened', async () => {
    let finish!: (lesson: Lesson) => void
    const lessons = new Map([
      ['l1', makeLesson()],
      ['l2', makeLesson({ id: 'l2', title: 'Other' })],
    ])
    const store = setupStore({
      getLesson: async (id) => lessons.get(id) ?? makeLesson(),
      updateLesson: () => new Promise((resolve) => (finish = resolve)),
    })
    await store.load('l1')
    store.draft.notes = 'Mine'
    const saving = store.save()

    await store.load('l2')
    finish(makeLesson({ notes: 'Mine', version: 4 }))
    await saving

    expect(store.lesson?.id).toBe('l2')
    expect(store.draft).toEqual({ title: 'Other', notes: 'Stores by domain' })
    expect(store.saveState).toBe('idle')
  })

  describe('autosave', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('saves once, after the user stops typing for the delay', async () => {
      const { calls, updateLesson } = recordingUpdate(async (version) =>
        makeLesson({ notes: 'abc', version: version + 1 }),
      )
      const store = await setupLoaded({ updateLesson })

      await typeNotes(store, 'a')
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1)
      await typeNotes(store, 'abc')
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1)
      expect(calls).toEqual([])

      await vi.advanceTimersByTimeAsync(1)

      expect(calls).toEqual([{ changes: { title: 'Vue state', notes: 'abc' }, version: 3 }])
      expect(store.saveState).toBe('saved')
    })

    it('waits for a running save, then saves the newer text with the new version', async () => {
      let finish!: (lesson: Lesson) => void
      const { calls, updateLesson } = recordingUpdate((version) =>
        version === 3
          ? new Promise((resolve) => (finish = resolve))
          : Promise.resolve(makeLesson({ notes: 'ab', version: 5 })),
      )
      const store = await setupLoaded({ updateLesson })

      await typeNotes(store, 'a')
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)
      await typeNotes(store, 'ab')
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)
      expect(calls).toHaveLength(1)

      finish(makeLesson({ notes: 'a', version: 4 }))
      await vi.advanceTimersByTimeAsync(0)

      expect(calls.map((call) => call.version)).toEqual([3, 4])
      expect(calls[1]?.changes.notes).toBe('ab')
      expect(store.isDirty).toBe(false)
    })

    it('pauses after a conflict until the user saves on purpose', async () => {
      const theirs = makeLesson({ notes: 'Theirs', version: 4 })
      const { calls, updateLesson } = recordingUpdate(async (version) => {
        if (version === 3) throw new ApiError(409, 'Changed', { current: theirs })
        return makeLesson({ notes: 'Mine again', version: 5 })
      })
      const store = await setupLoaded({ updateLesson })

      await typeNotes(store, 'Mine')
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)
      expect(store.saveState).toBe('conflict')
      expect(store.lesson).toEqual(theirs)

      await typeNotes(store, 'Mine again')
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)
      expect(calls).toHaveLength(1)

      await store.save()

      expect(calls.map((call) => call.version)).toEqual([3, 4])
      expect(store.saveState).toBe('saved')
    })
  })
})
