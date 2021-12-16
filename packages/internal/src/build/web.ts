import fs from 'fs'
import path from 'path'

import fse from 'fs-extra'
import { removeSync } from 'fs-extra'

import { findWebAssets } from '../files'
import { getPaths } from '../paths'

import { prebuildWebFile, Flags } from './babel/web'

// @MARK
// This whole file is currently only used in testing
// we may eventually use this to pretranspile the web side

export const cleanWebBuild = (outputDir = getPaths().generated.prebuild) => {
  const rwjsPaths = getPaths()
  const haveWebFolderInOutput = outputDir === getPaths().generated.prebuild

  removeSync(rwjsPaths.web.dist)
  removeSync(
    haveWebFolderInOutput
      ? path.join(outputDir, 'web')
      : path.join(outputDir, 'src')
  )
}

/**
 * Remove RedwoodJS "magic" from a user's code leaving JavaScript behind.
 */
export const prebuildWebFiles = (
  srcFiles: string[],
  flags?: Flags,
  outputDir = getPaths().generated.prebuild
) => {
  const rwjsPaths = getPaths()

  const haveWebFolderInOutput = outputDir === getPaths().generated.prebuild

  const builtFiles = srcFiles.map((srcPath) => {
    const relativePathFromSrc = path.relative(
      haveWebFolderInOutput ? rwjsPaths.base : rwjsPaths.web.base,
      srcPath
    )
    const dstPath = path
      .join(outputDir, relativePathFromSrc)
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

  return builtFiles
}

// @TMP: copy images/css/whatver over
export const copyAssetsToPrebuild = (
  outputDir = getPaths().generated.prebuild
) => {
  const assets = findWebAssets()
  const rwjsPaths = getPaths()
  const haveWebFolderInOutput = outputDir === getPaths().generated.prebuild

  assets.map((assetPath) => {
    const relativePathFromSrc = path.relative(
      haveWebFolderInOutput ? rwjsPaths.base : rwjsPaths.web.base,
      assetPath
    )
    const dstPath = path
      .join(outputDir, relativePathFromSrc)
      .replace(/\.(ts)$/, '.js')

    fs.copyFileSync(assetPath, dstPath)
  })

  fse.copySync(
    path.join(rwjsPaths.web.base, 'public'),
    path.join(outputDir, 'public')
  )
  fse.copyFileSync(
    path.join(rwjsPaths.web.base, 'package.json'),
    path.join(outputDir, 'package.json')
  )
}
