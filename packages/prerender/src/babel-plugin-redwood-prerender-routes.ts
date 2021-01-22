import type { PluginObj, types } from '@babel/core'
import { parse } from '@babel/parser'
import generate from '@babel/generator'
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
					;(path.get('body') as any).unshiftContainer('body', getASTToInsert())

					console.log('Babel output -> ', generate(parent).code)

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

		// Wrap in a function so it can be parsed
		const z = parse(`function blockToBeRemoved(){${switchStatement}}`)
		// const code = `console.log('hello world');`
		// const z = parse(code)

		// @ts-ignore-next-line
		const switchStatementAst = z.program.body[0].body.body[0]

		console.log('AST Switch output -> ', generate(switchStatementAst).code)

    return switchStatementAst
  }
}
