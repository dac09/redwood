import type { TransformOptions, PluginItem } from '@babel/core'

const packageJSON = require('../../../package.json')

export interface RegisterHookOptions {
  /**
   *  Be careful: plugins are a nested array e.g. [[plug1, x, x], [plug2, y, y]].
   *  These are in addition to the default RW plugins
   */
  plugins?: PluginItem[]
  overrides?: TransformOptions['overrides']
}

interface BabelRegisterOptions extends TransformOptions {
  extensions?: string[]
  cache?: boolean
}

/** NOTE:
 * We do this so we still get types, but don't import babel/register
 * Importing babel/register in typescript (instead of requiring) has dire consequences..

  Lets say we use the import syntax: import babelRequireHook from '@babel/register'
  - if your import in a JS file (like we used to in the cli project) - not a problem, and it would only invoke the register function when you called babelRequireHook
  - if you import in a TS file, the transpile process modifies it when we build the framework -
    so it will invoke it once as soon as you import, and another time when you use babelRequireHook...
    BUTTT!!! you won't notice it if your project is TS because by default it ignore .ts and .tsx files, but if its a JS project, it would try to transpile twice
 *
 *
 *
**/
export const registerBabel = (options: BabelRegisterOptions) => {
  require('@babel/register')(options)
}

// @NOTE On the API side: we may not need this once we solve why esbuild isn't shimming correctly
// These are mainly related to the preset-env/core-js shims
// On the Web side: TBD
export const getCommonBabelPlugins = () => {
  return [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    // Note: The private method loose mode configuration setting must be the
    // same as @babel/plugin-proposal class-properties.
    // (https://babeljs.io/docs/en/babel-plugin-proposal-private-methods#loose)
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    [
      '@babel/plugin-transform-runtime',
      {
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#core-js-aliasing
        // Setting the version here also requires `@babel/runtime-corejs3`
        corejs: { version: 3, proposals: true },
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#version
        // Transform-runtime assumes that @babel/runtime@7.0.0 is installed.
        // Specifying the version can result in a smaller bundle size.
        version: packageJSON.dependencies['@babel/runtime-corejs3'],
      },
    ],
  ]
}
