import type { CourseChanges } from '@/api/client'
import type { Course, Id } from '@/domain/types'

const STORAGE_KEY = 'prep-studio:mock-db'

interface MockData {
  courses: Course[]
}

export type UpdateResult =
  | { kind: 'ok'; course: Course }
  | { kind: 'not-found' }
  | { kind: 'conflict'; current: Course }

export function createMockDb(storage: Storage) {
  const data = load(storage)

  function save() {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  return {
    listCourses: () => data.courses,
    findCourse: (id: Id) => data.courses.find((course) => course.id === id),
    insertCourse(course: Course) {
      data.courses.push(course)
      save()
    },
    updateCourse(id: Id, changes: CourseChanges, version: number): UpdateResult {
      const course = data.courses.find((course) => course.id === id)
      if (!course) return { kind: 'not-found' }
      if (course.version !== version) return { kind: 'conflict', current: course }

      Object.assign(course, changes, { version: version + 1, updatedAt: new Date().toISOString() })
      save()

      return { kind: 'ok', course }
    },
    deleteCourse(id: Id): boolean {
      const index = data.courses.findIndex((course) => course.id === id)

      if (index < 0) return false

      data.courses.splice(index, 1)
      save()

      return true
    },
  }
}

function load(storage: Storage): MockData {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockData
  } catch {
    storage.removeItem(STORAGE_KEY)
  }

  return { courses: [] }
}
