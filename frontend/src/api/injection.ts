import type { ApiClient } from '@/api/client'
import { inject, type InjectionKey } from 'vue'

export const apiClientKey: InjectionKey<ApiClient> = Symbol('ApiClient')

export function useApiClient(): ApiClient {
  const api = inject(apiClientKey)
  if (!api) {
    throw new Error('ApiClient is not provided. Call app.provide(apiClientKey, client) first')
  }

  return api
}
