import { beforeEach, describe, expect, it } from 'vitest'

import type { Course } from '@/domain/types'
import { createMockDb } from '@/mocks/db'

const course: Course = {
  id: 'c1',
  title: 'Technical screen',
  track: 'technical',
  description: '',
  outline: [],
  version: 1,
  updatedAt: '2026-10-14T09:00:00.000Z',
}

beforeEach(() => localStorage.clear())

describe('mock db shared by two tabs', () => {
  it('sees a course inserted by the other tab', () => {
    const tabA = createMockDb(localStorage)
    const tabB = createMockDb(localStorage)

    tabA.insertCourse(course)

    expect(tabB.findCourse(course.id)).toEqual(course)
  })

  it('reports a conflict when the other tab updated first', () => {
    const tabA = createMockDb(localStorage)
    const tabB = createMockDb(localStorage)
    tabA.insertCourse(course)

    tabA.updateCourse(course.id, { title: 'From A' }, 1)

    expect(tabB.updateCourse(course.id, { title: 'From B' }, 1)).toMatchObject({
      kind: 'conflict',
      current: { title: 'From A', version: 2 },
    })
  })
})
