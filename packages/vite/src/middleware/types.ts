import type { ViteDevServer } from 'vite'

import type { RWRouteManifestItem } from '@redwoodjs/internal/dist/routes.js'
import type { Middleware, MiddlewareClass } from '@redwoodjs/web/middleware'

export type MiddlewareInvokeOptions = {
  route?: RWRouteManifestItem
  cssPaths?: Array<string>
  params?: Record<string, unknown>
  viteDevServer?: ViteDevServer
}

// Tuple of [mw, '*.{extension}']
export type MiddlewareReg = Array<
  [Middleware | MiddlewareClass, string] | Middleware | MiddlewareClass
>
