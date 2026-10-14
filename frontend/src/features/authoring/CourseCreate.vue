<script setup lang="ts">
import { ApiError } from '@/api/errors'
import type { Track } from '@/domain/types'
import { TRACKS } from '@/domain/types'
import type { ValidationErrors } from '@/domain/validation'
import { hasErrors, isTrack, validateCourse } from '@/domain/validation'
import { useCourseStore } from '@/stores/course'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const { createCourse } = useCourseStore()
const router = useRouter()

const form = ref<{ title: string; track: Track | ''; description: string }>({
  title: '',
  track: '',
  description: '',
})
const errors = ref<ValidationErrors>({})
const formError = ref<string | null>(null)
const submitting = ref(false)

async function submit() {
  formError.value = null
  const { title, track, description } = form.value
  errors.value = validateCourse({ title, track: track || undefined, description }, 'create')

  if (hasErrors(errors.value) || !isTrack(track)) return

  submitting.value = true
  try {
    await createCourse({ title, track, description })
    await router.push({ name: 'courses' })
  } catch (caught) {
    if (!(caught instanceof ApiError)) throw caught

    if (caught.status === 422) errors.value = caught.fieldErrors
    else formError.value = caught.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section>
    <h2 class="mb-4 text-lg font-semibold">New course</h2>

    <form
      class="mb-6 space-y-3 rounded border border-slate-200 bg-white p-4"
      @submit.prevent="submit"
    >
      <div>
        <label for="course-title" class="block text-sm font-medium">Title</label>
        <input
          id="course-title"
          v-model="form.title"
          class="w-full rounded border px-2 py-1"
          :aria-invalid="Boolean(errors.title)"
          aria-describedby="course-title-error"
          type="text"
        />
        <p v-if="errors.title" id="course-title-error" class="text-sm text-red-700">
          {{ errors.title[0] }}
        </p>
      </div>

      <div>
        <label for="course-track" class="block text-sm font-medium">Track</label>
        <select
          id="course-track"
          v-model="form.track"
          class="w-full rounded border px-2 py-1"
          :aria-invalid="Boolean(errors.track)"
          aria-describedby="course-track-error"
        >
          <option disabled value="">Choose a track</option>
          <option v-for="option in TRACKS" :key="option" :value="option">{{ option }}</option>
        </select>
        <p v-if="errors.track" id="course-track-error" class="text-sm text-red-700">
          {{ errors.track[0] }}
        </p>
      </div>

      <div>
        <label for="course-description" class="block text-sm font-medium">Description</label>
        <textarea
          id="course-description"
          v-model="form.description"
          class="w-full rounded border px-2 py-1"
        ></textarea>
      </div>

      <p v-if="formError" role="alert" class="rounded border border-red-300 bg-red-50 p-2 text-sm">
        {{ formError }}
      </p>

      <div class="flex items-center gap-4">
        <button
          type="submit"
          :disabled="submitting"
          class="rounded bg-slate-800 px-3 py-1 text-white disabled:opacity-50"
        >
          {{ submitting ? 'Creating...' : 'Create course' }}
        </button>
        <RouterLink :to="{ name: 'courses' }" class="text-sm underline">Cancel</RouterLink>
      </div>
    </form>
  </section>
</template>
