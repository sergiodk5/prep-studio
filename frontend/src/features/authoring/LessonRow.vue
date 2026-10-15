<script setup lang="ts">
import { ApiError } from '@/api/errors'
import type { OutlineEntry } from '@/domain/types'
import { validateLesson } from '@/domain/validation'
import { useOutlineStore } from '@/stores/outline'
import { nextTick, ref, useTemplateRef } from 'vue'

const { entry } = defineProps<{ entry: OutlineEntry }>()
const { renameLesson, deleteLesson } = useOutlineStore()

const editing = ref(false)
const draft = ref('')
const message = ref<string | null>(null)
const saving = ref(false)
const titleInput = useTemplateRef<HTMLInputElement>('titleInput')

const confirming = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const keepButton = useTemplateRef<HTMLButtonElement>('keepButton')

async function startEditing() {
  draft.value = entry.title
  message.value = null
  editing.value = true
  await nextTick()
  titleInput.value?.focus()
}

async function save() {
  message.value = validateLesson({ title: draft.value }, 'update').title?.[0] ?? null
  if (message.value) return

  saving.value = true
  try {
    await renameLesson(entry.lessonId, draft.value)
    editing.value = false
  } catch (caught) {
    if (!(caught instanceof ApiError)) throw caught
    message.value = caught.fieldErrors.title?.[0] ?? caught.message
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  deleteError.value = null
  confirming.value = true
  await nextTick()
  keepButton.value?.focus()
}

async function remove() {
  deleting.value = true
  deleteError.value = null
  try {
    await deleteLesson(entry.lessonId)
  } catch (caught) {
    if (!(caught instanceof ApiError)) throw caught
    deleteError.value = caught.message
    deleting.value = false
  }
}
</script>

<template>
  <li class="flex flex-wrap items-center gap-4 px-4 py-3">
    <form v-if="editing" class="flex flex-1 flex-wrap items-center gap-2" @submit.prevent="save">
      <label :for="`rename-${entry.lessonId}`" class="sr-only">Lesson title</label>
      <input
        :id="`rename-${entry.lessonId}`"
        ref="titleInput"
        v-model="draft"
        class="flex-1 rounded border px-2 py-1"
        :aria-invalid="Boolean(message)"
        :aria-describedby="`rename-${entry.lessonId}-message`"
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
      <p
        v-if="message"
        :id="`rename-${entry.lessonId}-message`"
        class="w-full text-sm text-red-700"
      >
        {{ message }}
      </p>
    </form>
    <template v-else>
      <span class="flex-1">{{ entry.title }}</span>
      <button
        type="button"
        class="text-sm underline"
        :aria-label="`Rename ${entry.title}`"
        @click="startEditing"
      >
        Rename
      </button>
      <button
        type="button"
        class="text-sm text-red-700 underline"
        :aria-label="`Delete ${entry.title}`"
        @click="confirmDelete"
      >
        Delete
      </button>
    </template>
    <div
      v-if="confirming"
      class="flex w-full flex-wrap items-center gap-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm"
    >
      <span class="flex-1">Delete "{{ entry.title }}"? This cannot be undone.</span>
      <button
        type="button"
        :disabled="deleting"
        class="rounded bg-red-700 px-3 py-1 text-white disabled:opacity-50"
        @click="remove"
      >
        Delete lesson
      </button>
      <button ref="keepButton" type="button" class="underline" @click="confirming = false">
        Keep
      </button>
      <p v-if="deleteError" class="w-full text-red-700">{{ deleteError }}</p>
    </div>
  </li>
</template>
