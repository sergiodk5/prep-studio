import type { CourseChanges, NewCourse } from '@/api/client'
import { ApiError } from '@/api/errors'
import { useApiClient } from '@/api/injection'
import type { Course, Id } from '@/domain/types'
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

  async function updateCourse(id: Id, changes: CourseChanges): Promise<Course> {
    const course = courses.value.find((item) => item.id === id)

    if (!course) throw new Error(`Course ${id} is not loaded`)

    try {
      const updated = await api.updateCourse(id, changes, course.version)
      replaceCourse(updated)
      return updated
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        replaceCourse(caught.current as Course)
      }
      if (caught instanceof ApiError && caught.status === 404) removeCourse(id)

      throw caught
    }
  }

  async function deleteCourse(id: Id): Promise<void> {
    try {
      await api.deleteCourse(id)
    } catch (caught) {
      if (!(caught instanceof ApiError) || caught.status !== 404) throw caught
    }
    removeCourse(id)
  }

  function replaceCourse(course: Course) {
    const index = courses.value.findIndex((item) => item.id === course.id)
    if (index >= 0) courses.value[index] = course
  }

  function removeCourse(id: Id) {
    courses.value = courses.value.filter((item) => item.id !== id)
  }

  return { courses, status, error, isEmpty, loadCourses, createCourse, updateCourse, deleteCourse }
})
