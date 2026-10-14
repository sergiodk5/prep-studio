import { describe, expect, it } from 'vitest'

import { TITLE_MAX_LENGTH, validateCourse } from '@/domain/validation'

describe('validateCourse', () => {
  it('returns an error when the title is passed and is empty', () => {
    const errors = validateCourse({ title: '   ' }, 'update')

    expect(errors.title).toEqual(['Title is required'])
  })

  it('returns an error when the title passed is greater than TITLE_MAX_LENGTH', () => {
    const errors = validateCourse(
      {
        title: 'a'.repeat(TITLE_MAX_LENGTH + 1),
      },
      'update',
    )

    expect(errors.title).toEqual([`Title must be ${TITLE_MAX_LENGTH} characters or fewer`])
  })

  it('accepts a title of exactly TITLE_MAX_LENGTH', () => {
    const errors = validateCourse(
      {
        title: 'a'.repeat(TITLE_MAX_LENGTH),
        track: 'pm',
      },
      'update',
    )

    expect(errors).toEqual({})
  })

  it('rejects a track that is not in TRACKS', () => {
    // @ts-expect-error test wrong value
    const errors = validateCourse({ title: 'MyTitle', track: 'track' }, 'update')

    expect(errors.track).toEqual(['Choose a track'])
  })

  it('returns no errors when updating with only description', () => {
    const errors = validateCourse({ description: 'my description' }, 'update')

    expect(errors).toEqual({})
  })

  it('returns errors when an empty object is passed on create mode', () => {
    const errors = validateCourse({}, 'create')

    expect(errors).toEqual({ title: ['Title is required'], track: ['Choose a track'] })
  })
})
