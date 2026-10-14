import type { Track } from '@/domain/types'

export const TRACK_BADGES: Record<Track, { label: string; className: string }> = {
  technical: { label: 'Technical', className: 'border-cyan-600 bg-cyan-100 text-cyan-800' },
  pm: { label: 'Product manager', className: 'border-blue-600 bg-blue-100 text-blue-800' },
  'tech-lead': { label: 'Tech lead', className: 'border-green-600 bg-green-100 text-green-800' },
  behavioural: {
    label: 'Behavioural',
    className: 'border-yellow-600 bg-yellow-100 text-yellow-800',
  },
  reverse: {
    label: 'Questions to ask',
    className: 'border-fuchsia-600 bg-fuchsia-100 text-fuchsia-800',
  },
}
