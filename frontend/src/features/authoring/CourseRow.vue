<script setup lang="ts">
import { ApiError } from '@/api/errors'
import type { Course } from '@/domain/types'
import { validateCourse } from '@/domain/validation'
import { TRACK_BADGES } from '@/features/authoring/tracks'
import { useCourseStore } from '@/stores/course'
import { nextTick, ref, useTemplateRef } from 'vue'

const { course } = defineProps<{ course: Course }>()
const { updateCourse } = useCourseStore()

const editing = ref(false)
const draft = ref('')
const message = ref<string | null>(null)
const saving = ref(false)
const titleInput = useTemplateRef<HTMLInputElement>('titleInput')

async function startEditing() {
  draft.value = course.title
  message.value = null
  editing.value = true
  await nextTick()
  titleInput.value?.focus()
}

async function save() {
  message.value = validateCourse({ title: draft.value }, 'update').title?.[0] ?? null
  if (message.value) return

  saving.value = true
  try {
    await updateCourse(course.id, { title: draft.value })
    editing.value = false
  } catch (caught) {
    if (!(caught instanceof ApiError)) throw caught
    message.value = messageFor(caught)
  } finally {
    saving.value = false
  }
}

function messageFor(error: ApiError): string {
  if (error.status === 409) {
    return `Someone else renamed this course to "${course.title}". Save again to keep your title.`
  }
  return error.fieldErrors.title?.[0] ?? error.message
}
</script>

<template>
  <li class="flex items-center gap-4 px-4 py-3">
    <form v-if="editing" class="flex flex-1 flex-wrap items-center gap-2" @submit.prevent="save">
      <label :for="`rename-${course.id}`" class="sr-only">Course title</label>
      <input
        :id="`rename-${course.id}`"
        ref="titleInput"
        v-model="draft"
        class="flex-1 rounded border px-2 py-1"
        :aria-invalid="Boolean(message)"
        :aria-describedby="`rename-${course.id}-message`"
        @keydown.esc="editing = false"
      />
      <button
        type="submit"
        :disabled="saving"
        class="rounded bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-50"
      >
        Save
      </button>
      <button type="button" class="text-sm underline" @click="editing = false">Cancel</button>
      <p v-if="message" :id="`rename-${course.id}-message`" class="w-full text-sm text-red-700">
        {{ message }}
      </p>
    </form>
    <template v-else>
      <span class="flex-1 font-medium">{{ course.title }}</span>
      <button
        type="button"
        class="text-sm underline"
        :aria-label="`Rename ${course.title}`"
        @click="startEditing"
      >
        Rename
      </button>
    </template>
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
</template>
