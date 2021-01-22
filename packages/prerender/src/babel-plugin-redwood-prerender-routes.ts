import type { PluginObj, types } from '@babel/core'
import { parse } from '@babel/parser'
// import template from '@babel/template'

import { getSwitchStatementForPrerender } from './router'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function (babel: any): PluginObj {
  const t: typeof types = babel.types
  return {
    name: 'babel-plugin-rw-routes-handler-prerender', // not required
    visitor: {
      ArrowFunctionExpression(path) {
        const { parent } = path
        if (!t.isVariableDeclarator(parent)) return
        const id = parent.id
        if (!t.isIdentifier(id)) return
        const name = id.name
        if (name === 'Routes') {
          console.log('AST to insert', getASTToInsert())
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(path.get('body') as any).unshiftContainer('body', getASTToInsert())
          // console.log(path.get('body'))
        }
      },
      FunctionDeclaration(path) {
        if (path.node?.id?.name == 'Routes') {
          path.get('body').unshiftContainer('body', getASTToInsert())
        }
      },
    },
  }

  function getASTToInsert() {
    const switchStatement = getSwitchStatementForPrerender()
    console.log(switchStatement)
    // const z = parse(`function bbb(){${switchStatement}}`)
    const z = parse(`console.log('hello');`)

    return z
  }
}
