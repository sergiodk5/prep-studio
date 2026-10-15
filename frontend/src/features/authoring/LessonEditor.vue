<script setup lang="ts">
import { validateLesson } from '@/domain/validation'
import { useLessonEditorStore } from '@/stores/lessonEditor'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'

const { id } = defineProps<{ id: string }>()
const store = useLessonEditorStore()
const { lesson, draft, status, error, saveState, saveError, isDirty } = storeToRefs(store)
const { load, save } = store

const titleError = computed(
  () => validateLesson({ title: draft.value.title }, 'update').title?.[0] ?? null,
)

const statusText = computed(() => {
  if (saveState.value === 'saving') return 'Saving...'
  if (saveState.value === 'failed') return 'Failed to save'
  if (saveState.value === 'conflict') return 'Not saved'
  return isDirty.value ? 'Unsaved changes' : 'All changes saved'
})

const saveMessage = computed(() => {
  if (saveState.value === 'conflict') {
    return 'Someone else saved this lesson first. Autosave is paused. Save again to keep your version.'
  }
  if (saveState.value !== 'failed') return null
  if (saveError.value?.status === 404) return 'This lesson was deleted.'
  return saveError.value?.message ?? 'Could not save the lesson.'
})

watch(
  () => id,
  (lessonId) => load(lessonId),
  { immediate: true },
)
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
        @submit.prevent="save"
      >
        <div>
          <label for="lesson-title" class="block text-sm font-medium">Title</label>
          <input
            id="lesson-title"
            v-model="draft.title"
            class="w-full rounded border px-2 py-1"
            :aria-invalid="Boolean(titleError)"
            aria-describedby="lesson-title-error"
          />
          <p v-if="titleError" id="lesson-title-error" class="text-sm text-red-700">
            {{ titleError }}
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

        <p v-if="saveMessage" role="alert" class="text-sm text-red-700">{{ saveMessage }}</p>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            :disabled="saveState === 'saving' || !isDirty || Boolean(titleError)"
            class="rounded bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            Save now
          </button>
          <p role="status" class="text-sm text-slate-600">
            {{ statusText }}
          </p>
        </div>
      </form>
    </template>
  </section>
</template>
