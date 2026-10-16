/// <reference types="vite/client" />
/// <reference types="msw/vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MOCKS?: 'true' | 'false'
}
