import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@/assets/main.css'

import App from '@/App.vue'
import router from '@/router'

if (import.meta.env.DEV) {
  const { network } = await import('virtual:msw')
  const { handlers } = await import('@/mocks/handlers')

  network.configure({ handlers })
  await network.enable()
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
