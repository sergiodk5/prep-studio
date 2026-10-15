<script setup lang="ts">
import { ApiError } from '@/api/errors'
import { validateLesson } from '@/domain/validation'
import { useOutlineStore } from '@/stores/outline'
import { ref } from 'vue'

const { addLesson } = useOutlineStore()

const title = ref('')
const message = ref<string | null>(null)
const adding = ref(false)

async function submit() {
  message.value = validateLesson({ title: title.value }, 'create').title?.[0] ?? null
  if (message.value) return

  adding.value = true
  try {
    await addLesson({ title: title.value })
    title.value = ''
  } catch (caught) {
    if (!(caught instanceof ApiError)) throw caught
    message.value = caught.fieldErrors.title?.[0] ?? caught.message
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <form class="mt-4 flex flex-wrap items-center gap-2" @submit.prevent="submit">
    <label for="new-lesson-title" class="sr-only">New lesson title</label>
    <input
      id="new-lesson-title"
      v-model="title"
      placeholder="New lesson title"
      class="flex-1 rounded border px-2 py-1"
      :aria-invalid="Boolean(message)"
      aria-describedby="new-lesson-message"
    />
    <button
      type="submit"
      :disabled="adding"
      class="rounded bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-50"
    >
      Add lesson
    </button>
    <p v-if="message" id="new-lesson-message" class="w-full text-sm text-red-700">
      {{ message }}
    </p>
  </form>
</template>
