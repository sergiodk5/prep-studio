import type { Course, Lesson, Track } from '@/domain/types'
import { TRACKS } from '@/domain/types'

export const TITLE_MAX_LENGTH = 120

export type CourseFields = Partial<Pick<Course, 'title' | 'track' | 'description'>>
export type ValidationErrors = Record<string, string[]>
export type ValidationMode = 'create' | 'update'

export type LessonFields = Partial<Pick<Lesson, 'title'>>

export function validateCourse(fields: CourseFields, mode: ValidationMode): ValidationErrors {
  const errors: ValidationErrors = {}
  const required = mode === 'create'

  if (required || fields.title !== undefined) {
    const error = titleError(fields.title)
    if (error) errors.title = [error]
  }

  if ((required || fields.track !== undefined) && !isTrack(fields.track)) {
    errors.track = ['Choose a track']
  }

  return errors
}

export function validateLesson(fields: LessonFields, mode: ValidationMode): ValidationErrors {
  const errors: ValidationErrors = {}

  if (mode === 'create' || fields.title !== undefined) {
    const error = titleError(fields.title)
    if (error) errors.title = [error]
  }

  return errors
}

export function isTrack(value: unknown): value is Track {
  return (TRACKS as readonly unknown[]).includes(value)
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}

function titleError(title: string | undefined): string | null {
  const trimmed = (title ?? '').trim()
  if (!trimmed) return 'Title is required'
  if (trimmed.length > TITLE_MAX_LENGTH)
    return `Title must be ${TITLE_MAX_LENGTH} characters or fewer`

  return null
}
