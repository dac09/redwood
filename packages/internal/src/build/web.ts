import fs from 'fs'
import path from 'path'

import { removeSync } from 'fs-extra'

import { findWebAssets } from '../files'
import { getPaths } from '../paths'

import { prebuildWebFile, Flags } from './babel/web'

// @MARK
// This whole file is currently only used in testing
// we may eventually use this to pretranspile the web side

export const cleanWebBuild = () => {
  const rwjsPaths = getPaths()
  removeSync(rwjsPaths.web.dist)
  removeSync(path.join(rwjsPaths.generated.prebuild, 'web'))
}

/**
 * Remove RedwoodJS "magic" from a user's code leaving JavaScript behind.
 */
export const prebuildWebFiles = (srcFiles: string[], flags?: Flags) => {
  const rwjsPaths = getPaths()

  const builtFiles = srcFiles.map((srcPath) => {
    const relativePathFromSrc = path.relative(rwjsPaths.base, srcPath)
    const dstPath = path
      .join(rwjsPaths.generated.prebuild, relativePathFromSrc)
      .replace(/\.(ts)$/, '.js')

    const result = prebuildWebFile(srcPath, flags)
    if (!result?.code) {
      console.warn('Error:', srcPath, 'could not prebuilt.')
      return undefined
    }

    fs.mkdirSync(path.dirname(dstPath), { recursive: true })
    fs.writeFileSync(dstPath, result.code)

    return dstPath
  })
  copyAssetsToPrebuild()

  return builtFiles
}

// @TMP: copy images/css/whatver over
export const copyAssetsToPrebuild = () => {
  const assets = findWebAssets()
  const rwjsPaths = getPaths()

  assets.map((assetPath) => {
    const relativePathFromSrc = path.relative(rwjsPaths.base, assetPath)
    const dstPath = path
      .join(rwjsPaths.generated.prebuild, relativePathFromSrc)
      .replace(/\.(ts)$/, '.js')

    fs.copyFileSync(assetPath, dstPath)
  })
}
