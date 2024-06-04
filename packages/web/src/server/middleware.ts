import type { ViteDevServer } from 'vite'

// eslint-disable-next-line no-restricted-imports
import type { RWRouteManifestItem } from '@redwoodjs/internal/dist/routes.js'

import { MiddlewareRequest } from './MiddlewareRequest.js'
import {
  MiddlewareResponse,
  MiddlewareShortCircuit,
} from './MiddlewareResponse.js'

export type Middleware = (
  req: MiddlewareRequest,
  res: MiddlewareResponse,
  options?: MiddlewareInvokeOptions,
) => Promise<MiddlewareResponse> | MiddlewareResponse | void

export interface MiddlewareClass {
  invoke: Middleware
}

export type MiddlewareInvokeOptions = {
  route?: RWRouteManifestItem
  cssPaths?: Array<string>
  params?: Record<string, unknown>
  viteDevServer?: ViteDevServer
}

export { MiddlewareRequest, MiddlewareResponse, MiddlewareShortCircuit }
