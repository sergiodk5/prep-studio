import { createCourseHandlers } from '@/mocks/courses'
import { createMockDb } from '@/mocks/db'

const db = createMockDb(localStorage)

export const handlers = [...createCourseHandlers(db)]
