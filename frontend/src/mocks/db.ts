import type { CourseChanges } from '@/api/client'
import type { Course, Id } from '@/domain/types'

const STORAGE_KEY = 'prep-studio:mock-db'

export interface MockData {
  courses: Course[]
}

export type UpdateResult =
  | { kind: 'ok'; course: Course }
  | { kind: 'not-found' }
  | { kind: 'conflict'; current: Course }

export function createMockDb(storage: Storage, initial: MockData = { courses: [] }) {
  function read(): MockData {
    return load(storage, initial)
  }

  function write(data: MockData) {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  return {
    listCourses: () => read().courses,
    findCourse: (id: Id) => read().courses.find((course) => course.id === id),
    insertCourse(course: Course) {
      const data = read()
      data.courses.push(course)
      write(data)
    },
    updateCourse(id: Id, changes: CourseChanges, version: number): UpdateResult {
      const data = read()
      const course = data.courses.find((course) => course.id === id)
      if (!course) return { kind: 'not-found' }
      if (course.version !== version) return { kind: 'conflict', current: course }

      Object.assign(course, changes, { version: version + 1, updatedAt: new Date().toISOString() })
      write(data)

      return { kind: 'ok', course }
    },
    deleteCourse(id: Id): boolean {
      const data = read()
      const index = data.courses.findIndex((course) => course.id === id)

      if (index < 0) return false

      data.courses.splice(index, 1)
      write(data)

      return true
    },
  }
}

function load(storage: Storage, initial: MockData): MockData {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockData
  } catch {
    storage.removeItem(STORAGE_KEY)
  }

  return structuredClone(initial)
}

export type MockDb = ReturnType<typeof createMockDb>
