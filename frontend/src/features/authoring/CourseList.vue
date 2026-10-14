<script setup lang="ts">
import type { Track } from '@/domain/types'
import { useCourseStore } from '@/stores/course'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'

const store = useCourseStore()
const { courses, isEmpty, status, error } = storeToRefs(store)
const { loadCourses } = store

loadCourses()

const TRACK_BADGES: Record<Track, { label: string; className: string }> = {
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
</script>

<template>
  <section>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">Courses</h2>
      <RouterLink
        :to="{ name: 'course-new' }"
        class="rounded bg-slate-800 px-3 py-1 text-sm text-white"
      >
        New course
      </RouterLink>
    </div>

    <p v-if="status === 'loading'" role="status">Loading courses...</p>

    <div
      v-else-if="status === 'error'"
      role="alert"
      class="rounded border border-red-300 bg-red-50 p-4"
    >
      <p>{{ error?.message ?? 'Could not load courses.' }}</p>
      <button type="button" class="mt-2 underline" @click="loadCourses()">Try again</button>
    </div>

    <p v-else-if="isEmpty" class="text-slate-600">No courses yet. Create your first one.</p>

    <ul v-else class="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
      <li v-for="course in courses" :key="course.id" class="flex items-center gap-4 px-4 py-3">
        <span class="flex-1 font-medium">{{ course.title }}</span>
        <span class="rounded border px-2 text-sm" :class="TRACK_BADGES[course.track].className">
          {{ TRACK_BADGES[course.track].label }}
        </span>
        <span class="text-sm text-slate-600">
          {{ course.outline.length }} {{ course.outline.length === 1 ? 'lesson' : 'lessons' }}
        </span>
        <time :datetime="course.updatedAt" class="text-sm text-slate-600">
          {{ new Date(course.updatedAt).toLocaleDateString() }}
        </time>
      </li>
    </ul>
  </section>
</template>
