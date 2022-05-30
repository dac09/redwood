// The `process.env.*` values are replaced by webpack at build time.
globalThis.RWJS_API_GRAPHQL_URL = RWJS_GLOBALS.RWJS_API_GRAPHQL_URL as string
globalThis.RWJS_API_DBAUTH_URL = RWJS_GLOBALS.RWJS_API_DBAUTH_URL as string
globalThis.RWJS_API_URL = RWJS_GLOBALS.RWJS_API_URL as string
globalThis.__REDWOOD__APP_TITLE = RWJS_GLOBALS.__REDWOOD__APP_TITLE as string
