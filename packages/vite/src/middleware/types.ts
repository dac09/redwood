import type { Middleware, MiddlewareClass } from '@redwoodjs/web/middleware'

// Tuple of [mw, '*.{extension}']
export type MiddlewareReg = Array<
  [Middleware | MiddlewareClass, string] | Middleware | MiddlewareClass
>
