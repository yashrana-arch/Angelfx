import { backendApi } from './backend'
import { mockApi } from './mock'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const api = USE_MOCK ? mockApi : backendApi

export { ApiError, tokenStore } from './http'
