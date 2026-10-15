import { createCourseHandlers } from '@/mocks/courses'
import { createMockDb } from '@/mocks/db'
import { createLessonHandlers } from '@/mocks/lessons'
import { seedData } from '@/mocks/seed'

const db = createMockDb(localStorage, seedData)

export const handlers = [...createCourseHandlers(db), ...createLessonHandlers(db)]
