import { httpClient } from '@/api/http'
import { apiClientKey } from '@/api/injection'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@/assets/main.css'

import App from '@/App.vue'
import router from '@/router'

if (import.meta.env.DEV) {
  const { startMocking } = await import('@/mocks/browser')
  await startMocking()
}

const app = createApp(App)

app.provide(apiClientKey, httpClient)

app.use(createPinia())
app.use(router)

app.mount('#app')
