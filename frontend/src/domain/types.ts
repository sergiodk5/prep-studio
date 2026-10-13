export const TRACKS = ['technical', 'pm', 'tech-lead', 'behavioural', 'reverse'] as const
export type Track = (typeof TRACKS)[number]

export type Id = string
export type IsoDate = string

export interface OutlineEntry {
  lessonId: Id
  title: string
  position: number
}

export interface Course {
  id: Id
  title: string
  track: Track
  description: string
  outline: OutlineEntry[]
  version: number
  updatedAt: IsoDate
}

export interface RubricRow {
  id: Id
  text: string
}

export interface FollowUp {
  id: Id
  prompt: string
  modelAnswer: string
  keyTerms: string[]
}

export interface PracticeItem {
  id: Id
  type: 'open' | 'choice'
  prompt: string
  modelAnswer: string
  keyTerms: string[]
  rubric: RubricRow[]
  followUps: FollowUp[]
  timeLimitSec: number
  labId: string | null
}

export interface Lock {
  by: Id
  until: IsoDate
}

export interface Lesson {
  id: Id
  courseId: Id
  title: string
  position: number
  notes: string
  tags: string[]
  items: PracticeItem[]
  version: number
  lock: Lock | null
  updatedAt: IsoDate
}
