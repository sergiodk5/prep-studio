import type { NewCourse } from '@/api/client'
import { ApiError } from '@/api/errors'
import { useApiClient } from '@/api/injection'
import type { Course } from '@/domain/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useCourseStore = defineStore('course', () => {
  const api = useApiClient()

  const courses = ref<Course[]>([])
  const status = ref<LoadStatus>('idle')
  const error = ref<ApiError | null>(null)

  const isEmpty = computed(() => status.value === 'ready' && courses.value.length === 0)

  async function loadCourses() {
    status.value = 'loading'
    error.value = null

    try {
      courses.value = await api.listCourses()
      status.value = 'ready'
    } catch (caught) {
      status.value = 'error'
      if (!(caught instanceof ApiError)) throw caught

      error.value = caught
    }
  }

  async function createCourse(input: NewCourse): Promise<Course> {
    const course = await api.createCourse(input)
    courses.value.push(course)
    return course
  }

  return { courses, status, error, isEmpty, loadCourses, createCourse }
})
