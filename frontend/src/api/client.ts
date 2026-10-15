import type { Course, Id, Lesson, Track } from '@/domain/types'

export interface RequestOptions {
  signal?: AbortSignal
}

export interface NewCourse {
  title: string
  track: Track
  description: string
}

export type CourseChanges = Partial<NewCourse>

export interface ApiClient {
  listCourses(options?: RequestOptions): Promise<Course[]>
  getCourse(id: Id, options?: RequestOptions): Promise<Course>
  createCourse(input: NewCourse): Promise<Course>
  updateCourse(id: Id, changes: CourseChanges, version: number): Promise<Course>
  deleteCourse(id: Id): Promise<void>
  getLesson(id: Id, options?: RequestOptions): Promise<Lesson>
  createLesson(courseId: Id, input: NewLesson): Promise<Lesson>
  updateLesson(id: Id, changes: LessonChanges, version: number): Promise<Lesson>
  deleteLesson(id: Id): Promise<void>
}

export interface NewLesson {
  title: string
}

export type LessonChanges = Partial<Pick<Lesson, 'title' | 'notes' | 'tags' | 'items'>>
