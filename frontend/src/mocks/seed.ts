import type { Course, Id, Lesson, Track } from '@/domain/types'
import type { MockData } from '@/mocks/db'

const SEEDED_AT = '2026-10-12T00:00:00.000Z'

function seedCourse(
  track: Track,
  title: string,
  description: string,
  lessons: Lesson[] = [],
): Course {
  return {
    id: `seed-${track}`,
    title,
    track,
    description,
    outline: lessons.map(({ id, title, position }) => ({ lessonId: id, title, position })),
    version: 1,
    updatedAt: SEEDED_AT,
  }
}

function seedLesson(courseId: Id, position: number, title: string): Lesson {
  return {
    id: `${courseId}-lesson-${position + 1}`,
    courseId,
    title,
    position,
    notes: '',
    tags: [],
    items: [],
    version: 1,
    lock: null,
    updatedAt: SEEDED_AT,
  }
}

const technicalLessons = [
  'Vue state and stores',
  'Rendering performance',
  'MongoDB data modelling',
  'PHP and Laravel',
].map((title, position) => seedLesson('seed-technical', position, title))

export const seedData: MockData = {
  courses: [
    seedCourse(
      'technical',
      'Technical screen',
      'The JobMojito questions: Vue state, performance, MongoDB, PHP.',
      technicalLessons,
    ),
    seedCourse('pm', 'Product manager round', 'Product thinking, trade-offs and working with PMs.'),
    seedCourse(
      'tech-lead',
      'Tech lead round',
      'Architecture, testing strategy, legacy code and leading a team.',
    ),
    seedCourse('behavioural', 'Behavioural stories', 'STAR stories, under two minutes each.'),
    seedCourse(
      'reverse',
      'Questions to ask them',
      'What I want to learn about the team and the role.',
    ),
  ],
  lessons: technicalLessons,
}
