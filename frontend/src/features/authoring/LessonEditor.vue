<script setup lang="ts">
import { ApiError } from '@/api/errors'
import type { ValidationErrors } from '@/domain/validation'
import { hasErrors, validateLesson } from '@/domain/validation'
import { useLessonEditorStore } from '@/stores/lessonEditor'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

const { id } = defineProps<{ id: string }>()
const store = useLessonEditorStore()
const { lesson, draft, status, error, isDirty } = storeToRefs(store)
const { load, save } = store

const errors = ref<ValidationErrors>({})
const formError = ref<string | null>(null)
const saving = ref(false)

watch(
  () => id,
  (lessonId) => load(lessonId),
  { immediate: true },
)

async function submit() {
  formError.value = null
  errors.value = validateLesson({ title: draft.value.title }, 'update')
  if (hasErrors(errors.value)) return

  saving.value = true
  try {
    await save()
  } catch (caught) {
    if (!(caught instanceof ApiError)) throw caught

    if (caught.status === 422) errors.value = caught.fieldErrors
    else formError.value = messageFor(caught)
  } finally {
    saving.value = false
  }
}

function messageFor(caught: ApiError): string {
  if (caught.status === 409) {
    return 'Someone else saved this lesson first. Save again to keep your version.'
  }
  if (caught.status === 404) return 'This lesson was deleted.'
  return caught.message
}
</script>

<template>
  <section>
    <p v-if="!lesson && status === 'loading'" role="status">Loading lesson...</p>

    <div
      v-else-if="status === 'error'"
      role="alert"
      class="rounded border border-red-300 bg-red-50 p-4"
    >
      <template v-if="error?.status === 404">
        <p>This lesson does not exist. It may have been deleted.</p>
      </template>
      <template v-else>
        <p>{{ error?.message ?? 'Could not load the lesson.' }}</p>
        <button type="button" class="mt-2 underline" @click="load(id)">Try again</button>
      </template>
    </div>

    <template v-else-if="lesson">
      <RouterLink
        :to="{ name: 'course', params: { id: lesson.courseId } }"
        class="text-sm underline"
      >
        Back to course
      </RouterLink>

      <form
        class="mt-4 space-y-3 rounded border border-slate-200 bg-white p-4"
        @submit.prevent="submit"
      >
        <div>
          <label for="lesson-title" class="block text-sm font-medium">Title</label>
          <input
            id="lesson-title"
            v-model="draft.title"
            class="w-full rounded border px-2 py-1"
            :aria-invalid="Boolean(errors.title)"
            aria-describedby="lesson-title-error"
          />
          <p v-if="errors.title" id="lesson-title-error" class="text-sm text-red-700">
            {{ errors.title[0] }}
          </p>
        </div>

        <div>
          <label for="lesson-notes" class="block text-sm font-medium">Notes (Markdown)</label>
          <textarea
            id="lesson-notes"
            v-model="draft.notes"
            rows="12"
            class="w-full rounded border px-2 py-1 font-mono text-sm"
          ></textarea>
        </div>

        <p v-if="formError" role="alert" class="text-sm text-red-700">{{ formError }}</p>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            :disabled="saving || !isDirty"
            class="rounded bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            Save
          </button>
          <p role="status" class="text-sm text-slate-600">
            {{ saving ? 'Saving...' : isDirty ? 'Unsaved changes' : 'All changes saved' }}
          </p>
        </div>
      </form>
    </template>
  </section>
</template>
