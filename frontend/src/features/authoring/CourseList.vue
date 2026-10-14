<script setup lang="ts">
import CourseRow from '@/features/authoring/CourseRow.vue'
import { useCourseStore } from '@/stores/course'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'

const store = useCourseStore()
const { courses, isEmpty, status, error } = storeToRefs(store)
const { loadCourses } = store

loadCourses()
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
      <CourseRow v-for="course in courses" :key="course.id" :course="course" />
    </ul>
  </section>
</template>
