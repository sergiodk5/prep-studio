import { ApiError } from '@/api/errors'
import { useApiClient } from '@/api/injection'
import type { Id, Lesson } from '@/domain/types'
import type { LoadStatus } from '@/stores/course'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface LessonDraft {
  title: string
  notes: string
}

export const useLessonEditorStore = defineStore('lessonEditor', () => {
  const api = useApiClient()

  const lesson = ref<Lesson | null>(null)
  const draft = ref<LessonDraft>({ title: '', notes: '' })
  const status = ref<LoadStatus>('idle')
  const error = ref<ApiError | null>(null)
  let controller: AbortController | null = null

  const isDirty = computed(
    () =>
      lesson.value !== null &&
      (draft.value.title !== lesson.value.title || draft.value.notes !== lesson.value.notes),
  )

  async function load(id: Id) {
    controller?.abort()
    const request = new AbortController()
    controller = request

    if (lesson.value?.id !== id) lesson.value = null
    status.value = 'loading'
    error.value = null

    try {
      const loaded = await api.getLesson(id, { signal: request.signal })
      if (request.signal.aborted) return

      lesson.value = loaded
      draft.value = { title: loaded.title, notes: loaded.notes }
      status.value = 'ready'
    } catch (caught) {
      if (request.signal.aborted) return

      status.value = 'error'
      if (!(caught instanceof ApiError)) throw caught

      error.value = caught
    }
  }

  async function save(): Promise<void> {
    const current = lesson.value
    if (!current) throw new Error('No lesson is loaded')

    const sent = { ...draft.value }
    try {
      const saved = await api.updateLesson(current.id, sent, current.version)
      lesson.value = saved
      if (draft.value.title === sent.title) draft.value.title = saved.title
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        lesson.value = caught.current as Lesson
      }

      throw caught
    }
  }

  return { lesson, draft, status, error, isDirty, load, save }
})
