<script setup lang="ts">
import LessonAddForm from '@/features/authoring/LessonAddForm.vue'
import LessonRow from '@/features/authoring/LessonRow.vue'
import { TRACK_BADGES } from '@/features/authoring/tracks'
import { useOutlineStore } from '@/stores/outline'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { RouterLink } from 'vue-router'

const { id } = defineProps<{ id: string }>()
const store = useOutlineStore()
const { course, status, error } = storeToRefs(store)
const { load } = store

watch(
  () => id,
  (courseId) => load(courseId),
  { immediate: true },
)
</script>

<template>
  <section>
    <RouterLink :to="{ name: 'courses' }" class="text-sm underline">Back to courses</RouterLink>

    <p v-if="!course && status === 'loading'" role="status" class="mt-4">Loading course...</p>

    <div
      v-else-if="status === 'error'"
      role="alert"
      class="mt-4 rounded border border-red-300 bg-red-50 p-4"
    >
      <template v-if="error?.status === 404">
        <p>This course does not exist. It may have been deleted.</p>
      </template>
      <template v-else>
        <p>{{ error?.message ?? 'Could not load the course.' }}</p>
        <button type="button" class="mt-2 underline" @click="load(id)">Try again</button>
      </template>
    </div>

    <template v-else-if="course">
      <div class="mt-4 mb-2 flex flex-wrap items-center gap-3">
        <h2 class="text-lg font-semibold">{{ course.title }}</h2>
        <span class="rounded border px-2 text-sm" :class="TRACK_BADGES[course.track].className">
          {{ TRACK_BADGES[course.track].label }}
        </span>
      </div>
      <p v-if="course.description" class="mb-4 text-slate-600">{{ course.description }}</p>

      <p v-if="course.outline.length === 0" class="text-slate-600">No lessons yet.</p>
      <ol
        v-else
        aria-label="Lessons"
        class="divide-y divide-slate-200 rounded border border-slate-200 bg-white"
      >
        <LessonRow v-for="entry in course.outline" :key="entry.lessonId" :entry="entry" />
      </ol>

      <LessonAddForm />
    </template>
  </section>
</template>
