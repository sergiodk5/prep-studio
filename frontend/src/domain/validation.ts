import type { Course, Track } from '@/domain/types'
import { TRACKS } from '@/domain/types'

export const TITLE_MAX_LENGTH = 120

export type CourseFields = Partial<Pick<Course, 'title' | 'track' | 'description'>>
export type ValidationErrors = Record<string, string[]>
export type ValidationMode = 'create' | 'update'

export function validateCourse(fields: CourseFields, mode: ValidationMode): ValidationErrors {
  const errors: ValidationErrors = {}
  const required = mode === 'create'

  if (required || fields.title !== undefined) {
    const title = (fields.title ?? '').trim()
    if (!title) {
      errors.title = ['Title is required']
    } else if (title.length > TITLE_MAX_LENGTH) {
      errors.title = [`Title must be ${TITLE_MAX_LENGTH} characters or fewer`]
    }
  }

  if ((required || fields.track !== undefined) && !isTrack(fields.track)) {
    errors.track = ['Choose a track']
  }

  return errors
}

export function isTrack(value: unknown): value is Track {
  return (TRACKS as readonly unknown[]).includes(value)
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}
