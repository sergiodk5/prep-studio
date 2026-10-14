import type { Course, Track } from '@/domain/types'
import type { MockData } from '@/mocks/db'

const SEEDED_AT = '2026-10-12T00:00:00.000Z'

function seedCourse(track: Track, title: string, description: string): Course {
  return {
    id: `seed-${track}`,
    title,
    track,
    description,
    outline: [],
    version: 1,
    updatedAt: SEEDED_AT,
  }
}

export const seedData: MockData = {
  courses: [
    seedCourse(
      'technical',
      'Technical screen',
      'The JobMojito questions: Vue state, performance, MongoDB, PHP.',
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
}
