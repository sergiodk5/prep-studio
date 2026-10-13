import { ApiError, toApiError } from '@/api/errors'
import { describe, expect, it } from 'vitest'

describe('toApiError', () => {
  it('maps a contract error body to an ApiError', () => {
    const error = toApiError(422, { message: 'Invalid course', errors: { title: ['Required'] } })

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.message).toBe('Invalid course')
    expect(error.fieldErrors).toEqual({ title: ['Required'] })
  })

  it('returns a generic message when the server returns HTML', () => {
    const error = toApiError(502, '<!DOCTYPE html>')

    expect(error.status).toBe(502)
    expect(error.message).toBe('Request failed with status 502')
    expect(error.fieldErrors).toEqual({})
  })

  it('keeps the server copy on a conflict', () => {
    const current = { id: 'c1', title: 'Technical scren', version: 3 }

    const error = toApiError(409, { message: 'Version conflict', current })

    expect(error.status).toBe(409)
    expect(error.current).toEqual(current)
  })
})
