import { HttpResponse } from 'msw/http'

import type { ValidationErrors } from '@/domain/validation'

export function notFound(message: string) {
  return HttpResponse.json({ message }, { status: 404 })
}

export function unprocessable(errors: ValidationErrors) {
  return HttpResponse.json(
    { message: 'Please fix the highlighted fields', errors },
    { status: 422 },
  )
}

export function conflict<T>(message: string, current: T) {
  return HttpResponse.json({ message, current }, { status: 409 })
}
