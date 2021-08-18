import fs from 'fs'
import path from 'path'

import type { TransformOptions } from '@babel/core'

import { getPaths } from '../../paths'

import {
  getCommonBabelPlugins,
  registerBabel,
  RegisterHookOptions,
} from './common'

const TARGETS_NODE = '12.16'
// Warning! Use the minor core-js version: "corejs: '3.6'", instead of "corejs: 3",
// because we want to include the features added in the minor version.
// https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env
const CORE_JS_VERSION = '3.16'

export const getApiSideBabelPlugins = () => {
  const rwjsPaths = getPaths()
  // Plugin shape: [ ["Target", "Options", "name"] ],
  // a custom "name" is supplied so that user's do not accidently overwrite
  // Redwood's own plugins.
  const apiPlugins: TransformOptions['plugins'] = [
    ['@babel/plugin-transform-typescript', undefined, 'rwjs-babel-typescript'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-src-alias')
        .default,
      {
        srcAbsPath: rwjsPaths.api.src,
      },
      'rwjs-babel-src-alias',
    ],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-directory-named-import')
        .default,
      undefined,
      'rwjs-babel-directory-named-modules',
    ],
    [
      'babel-plugin-auto-import',
      {
        declarations: [
          {
            // import gql from 'graphql-tag'
            default: 'gql',
            path: 'graphql-tag',
          },
          {
            // import { context } from '@redwoodjs/api'
            members: ['context'],
            path: '@redwoodjs/api',
          },
        ],
      },
      'rwjs-babel-auto-import',
    ],
    // FIXME: Babel plugin GraphQL tag doesn't seem to be working.
    ['babel-plugin-graphql-tag', undefined, 'rwjs-babel-graphql-tag'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-import-dir')
        .default,
      undefined,
      'rwjs-babel-glob-import-dir',
    ],
  ].filter(Boolean)

  return [...getCommonBabelPlugins(), ...apiPlugins]
}

// @TODO We should not need presets, if esbuild is configured/working correctly
// This is there, because netlify/AWS deployments do not run without corejs shims
export const getApiSideBabelPresets = () => {
  return [
    [
      '@babel/preset-env',
      {
        targets: {
          node: TARGETS_NODE,
        },
        useBuiltIns: 'usage',
        corejs: {
          version: CORE_JS_VERSION,
          // List of supported proposals: https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#ecmascript-proposals
          proposals: true,
        },
        exclude: [
          // Remove class-properties from preset-env, and include separately with loose
          // https://github.com/webpack/webpack/issues/9708
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-private-methods',
          '@babel/plugin-proposal-private-property-in-object',
        ],
      },
    ],
  ]
}

export const getApiSideBabelConfigPath = () => {
  const p = path.join(getPaths().api.base, 'babel.config.js')
  if (fs.existsSync(p)) {
    return p
  } else {
    return undefined
  }
}

// Used in cli commands that need to use es6, lib and services
export const registerApiSideBabelHook = ({
  plugins = [],
  overrides,
}: RegisterHookOptions = {}) => {
  registerBabel({
    // @NOTE
    // Even though we specify the config file, babel will still search for it
    // and merge them because we have specified the filename property, unless babelrc = false
    configFile: getApiSideBabelConfigPath(), // incase user has a custom babel.config.js in api
    babelrc: false,
    extensions: ['.js', '.ts'],
    plugins: [...getApiSideBabelPlugins(), ...plugins],
    ignore: ['node_modules'],
    cache: false,
    overrides,
  })
}
