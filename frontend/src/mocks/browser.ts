import { HttpNetworkFrame } from 'msw/experimental'
import { network } from 'virtual:msw'

import { handlers } from '@/mocks/handlers'

export async function startMocking(): Promise<void> {
  network.configure({
    handlers,
    onUnhandledFrame({ frame, defaults }) {
      if (frame instanceof HttpNetworkFrame && !isApiRequest(frame.data.request)) return
      defaults.warn()
    },
  })
  await network.enable()
}

function isApiRequest(request: Request): boolean {
  return new URL(request.url).pathname.startsWith('/api/')
}
