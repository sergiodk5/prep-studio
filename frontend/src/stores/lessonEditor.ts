import { ApiError } from '@/api/errors'
import { useApiClient } from '@/api/injection'
import type { Id, Lesson } from '@/domain/types'
import { hasErrors, validateLesson } from '@/domain/validation'
import type { LoadStatus } from '@/stores/course'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const AUTOSAVE_DELAY_MS = 1500

export interface LessonDraft {
  title: string
  notes: string
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed' | 'conflict'

export const useLessonEditorStore = defineStore('lessonEditor', () => {
  const api = useApiClient()

  const lesson = ref<Lesson | null>(null)
  const draft = ref<LessonDraft>({ title: '', notes: '' })
  const status = ref<LoadStatus>('idle')
  const error = ref<ApiError | null>(null)
  const saveState = ref<SaveState>('idle')
  const saveError = ref<ApiError | null>(null)
  let controller: AbortController | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let saveAgain = false

  const isDirty = computed(
    () =>
      lesson.value !== null &&
      (draft.value.title !== lesson.value.title || draft.value.notes !== lesson.value.notes),
  )
  const hasUnsavedChanges = computed(() => isDirty.value || saveState.value === 'saving')

  watch(
    draft,
    () => {
      if (saveState.value !== 'conflict') scheduleSave()
    },
    { deep: true },
  )

  function scheduleSave() {
    clearTimeout(timer)
    timer = setTimeout(() => void save(), AUTOSAVE_DELAY_MS)
  }

  async function load(id: Id) {
    controller?.abort()
    const request = new AbortController()
    controller = request

    clearTimeout(timer)
    saveAgain = false
    saveState.value = 'idle'
    saveError.value = null
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
    clearTimeout(timer)
    if (saveState.value === 'saving') {
      saveAgain = true
      return
    }

    const current = lesson.value
    if (!current || !isDirty.value || hasErrors(validateLesson(draft.value, 'update'))) return

    saveState.value = 'saving'
    saveError.value = null
    const sent = { ...draft.value }

    try {
      const saved = await api.updateLesson(current.id, sent, current.version)
      if (lesson.value?.id !== current.id) return

      lesson.value = saved
      if (draft.value.title === sent.title) draft.value.title = saved.title
      saveState.value = 'saved'
    } catch (caught) {
      if (lesson.value?.id !== current.id) return

      saveState.value = 'failed'
      if (!(caught instanceof ApiError)) throw caught

      saveError.value = caught
      if (caught.status === 409) {
        lesson.value = caught.current as Lesson
        saveState.value = 'conflict'
      }
    }

    if (saveAgain && saveState.value === 'saved') {
      saveAgain = false
      await save()
    }
  }

  async function flush(): Promise<void> {
    if (saveState.value !== 'conflict') await save()
  }

  return {
    lesson,
    draft,
    status,
    error,
    saveState,
    saveError,
    isDirty,
    hasUnsavedChanges,
    load,
    save,
    flush,
  }
})
