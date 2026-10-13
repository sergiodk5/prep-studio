export type FieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors
  readonly current: unknown

  constructor(
    status: number,
    message: string,
    details: { fieldErrors?: FieldErrors; current?: unknown } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = details.fieldErrors ?? {}
    this.current = details.current ?? null
  }
}

export function toApiError(status: number, body: unknown): ApiError {
  if (!isRecord(body) || typeof body.message !== 'string') {
    return new ApiError(status, `Request failed with status ${status}`)
  }

  return new ApiError(status, body.message, {
    fieldErrors: isRecord(body.errors) ? (body.errors as FieldErrors) : {},
    current: body.current,
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
