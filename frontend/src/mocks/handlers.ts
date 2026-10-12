import { http, HttpResponse } from 'msw/http'

export const handlers = [http.get('/api/health', () => HttpResponse.json({ ok: true }))]
