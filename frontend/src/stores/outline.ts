import type { NewLesson } from '@/api/client'
import { ApiError } from '@/api/errors'
import { useApiClient } from '@/api/injection'
import type { Course, Id, Lesson } from '@/domain/types'
import type { LoadStatus } from '@/stores/course'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOutlineStore = defineStore('outline', () => {
  const api = useApiClient()

  const course = ref<Course | null>(null)
  const status = ref<LoadStatus>('idle')
  const error = ref<ApiError | null>(null)
  let controller: AbortController | null = null

  async function load(id: Id) {
    controller?.abort()
    const request = new AbortController()
    controller = request

    if (course.value?.id !== id) course.value = null
    status.value = 'loading'
    error.value = null

    try {
      const loaded = await api.getCourse(id, { signal: request.signal })
      if (request.signal.aborted) return

      course.value = loaded
      status.value = 'ready'
    } catch (caught) {
      if (request.signal.aborted) return

      status.value = 'error'
      if (!(caught instanceof ApiError)) throw caught

      error.value = caught
    }
  }

  async function addLesson(input: NewLesson): Promise<Lesson> {
    const current = requireCourse()
    const lesson = await api.createLesson(current.id, input)
    current.outline.push({ lessonId: lesson.id, title: lesson.title, position: lesson.position })
    return lesson
  }

  async function renameLesson(lessonId: Id, title: string): Promise<void> {
    const current = requireCourse()

    try {
      const lesson = await api.getLesson(lessonId)
      const updated = await api.updateLesson(lessonId, { title }, lesson.version)
      const entry = current.outline.find((item) => item.lessonId === lessonId)
      if (entry) entry.title = updated.title
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) removeEntry(current, lessonId)
      throw caught
    }
  }

  async function deleteLesson(lessonId: Id): Promise<void> {
    const current = requireCourse()

    try {
      await api.deleteLesson(lessonId)
    } catch (caught) {
      if (!(caught instanceof ApiError) || caught.status !== 404) throw caught
    }

    removeEntry(current, lessonId)
  }

  function requireCourse(): Course {
    if (!course.value) throw new Error('No course is loaded')
    return course.value
  }

  return { course, status, error, load, addLesson, renameLesson, deleteLesson }
})

function removeEntry(course: Course, lessonId: Id) {
  course.outline = course.outline
    .filter((item) => item.lessonId !== lessonId)
    .map((item, position) => ({ ...item, position }))
}
