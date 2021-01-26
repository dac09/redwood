import type { PluginObj, types } from '@babel/core'
import generate from '@babel/generator'

import { processPagesDir } from '@redwoodjs/internal'

export default function ({ types: t }: { types: typeof types }): PluginObj {
  let pages = processPagesDir()

  return {
    name: 'babel-plugin-rw-routes-handler-prerender', // not required
    visitor: {
      ImportDeclaration(p) {
        if (pages.length === 0) {
          return
        }
        const declaredImports = p.node.specifiers.map(
          (specifier) => specifier.local.name
        )
        pages = pages.filter((dep) => !declaredImports.includes(dep.const))
      },
      Program: {
        exit(program) {
          if (pages.length === 0) {
            return
          }
          const nodes = []
          // require() all pages, append to top of the file
          for (const { importName, importPath } of pages) {
            // + const <importName> = require(importPath)
            nodes.push(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(importName),
                  t.callExpression(t.identifier('require'), [
                    t.stringLiteral(importPath),
                  ])
                ),
              ])
            )
          }
          // Insert at the top of the file
          program.node.body.unshift(...nodes)

          // Debug output ->
          console.log('running custom plugin')
          console.log(t.arrayPattern)
          console.log('What its outputting ->>')
          console.log(generate(program.node))
        },
      },
    },
  }
}
