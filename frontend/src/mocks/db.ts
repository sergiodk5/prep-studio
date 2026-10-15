import type { CourseChanges, LessonChanges } from '@/api/client'
import type { Course, Id, IsoDate, Lesson } from '@/domain/types'

const STORAGE_KEY = 'prep-studio:mock-db'

export interface MockData {
  courses: Course[]
  lessons: Lesson[]
}

export type UpdateResult<T> =
  | { kind: 'ok'; value: T }
  | { kind: 'not-found' }
  | { kind: 'conflict'; current: T }

export function createMockDb(storage: Storage, initial: MockData = { courses: [], lessons: [] }) {
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
    updateCourse(id: Id, changes: CourseChanges, version: number): UpdateResult<Course> {
      const data = read()
      const result = applyUpdate(
        data.courses.find((course) => course.id === id),
        changes,
        version,
      )
      if (result.kind === 'ok') write(data)
      return result
    },
    deleteCourse(id: Id): boolean {
      const data = read()
      const index = data.courses.findIndex((course) => course.id === id)

      if (index < 0) return false

      data.courses.splice(index, 1)
      data.lessons = data.lessons.filter((lesson) => lesson.courseId !== id)
      write(data)

      return true
    },
    findLesson: (id: Id) => read().lessons.find((lesson) => lesson.id === id),
    insertLesson(courseId: Id, lesson: Omit<Lesson, 'courseId' | 'position'>): Lesson | null {
      const data = read()
      const course = data.courses.find((item) => item.id === courseId)
      if (!course) return null

      const stored: Lesson = { ...lesson, courseId, position: course.outline.length }
      course.outline.push({ lessonId: stored.id, title: stored.title, position: stored.position })
      data.lessons.push(stored)
      write(data)
      return stored
    },
    updateLesson(id: Id, changes: LessonChanges, version: number): UpdateResult<Lesson> {
      const data = read()
      const result = applyUpdate(
        data.lessons.find((lesson) => lesson.id === id),
        changes,
        version,
      )
      if (result.kind !== 'ok') return result

      const entry = data.courses
        .find((course) => course.id === result.value.courseId)
        ?.outline.find((item) => item.lessonId === id)
      if (entry) entry.title = result.value.title
      write(data)
      return result
    },
    deleteLesson(id: Id): boolean {
      const data = read()
      const lesson = data.lessons.find((item) => item.id === id)
      if (!lesson) return false

      data.lessons = data.lessons.filter((item) => item.id !== id)
      const course = data.courses.find((item) => item.id === lesson.courseId)
      if (course) {
        course.outline = course.outline
          .filter((item) => item.lessonId !== id)
          .map((item, position) => ({ ...item, position }))
      }
      write(data)
      return true
    },
  }
}

function load(storage: Storage, initial: MockData): MockData {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw) return { courses: [], lessons: [], ...(JSON.parse(raw) as Partial<MockData>) }
  } catch {
    storage.removeItem(STORAGE_KEY)
  }

  return structuredClone(initial)
}

function applyUpdate<T extends { version: number; updatedAt: IsoDate }>(
  record: T | undefined,
  changes: NoInfer<Partial<T>>,
  version: number,
): UpdateResult<T> {
  if (!record) return { kind: 'not-found' }
  if (record.version !== version) return { kind: 'conflict', current: record }

  Object.assign(record, changes, { version: version + 1, updatedAt: new Date().toISOString() })
  return { kind: 'ok', value: record }
}

export type MockDb = ReturnType<typeof createMockDb>
