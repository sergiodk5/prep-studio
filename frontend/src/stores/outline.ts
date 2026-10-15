import { ApiError } from '@/api/errors'
import { useApiClient } from '@/api/injection'
import type { Course, Id } from '@/domain/types'
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

  return { course, status, error, load }
})
