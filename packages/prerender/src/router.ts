import { getProject } from '@redwoodjs/structure'

export const detectPrerenderRoutes = () => {
  const rwProject = getProject(process.cwd())
  const routes = rwProject.getRouter().routes

  const prerenderRoutes = routes
    .filter((route) => !route.isNotFound) // ignore notFound page
    .filter((route) => !route.hasParameters) // ignore routes that take params
    .filter((route) => route.prerender) // only select routes with prerender prop
    .map((route) => ({
      name: route.name,
      path: route.path,
      isPrivate: route.isPrivate,
      id: route.id,
      whileLoading: route.whileLoadingAttr,
      filePath: route.page?.filePath,
    }))

  return prerenderRoutes
}

export const getSwitchStatementForPrerender = () => {
  const lines: string[] = []
  const rwProject = getProject(process.cwd())
  const routes = rwProject.getRouter().routes

  for (const route of routes) {
    if (!route.path) continue
    const componentToRenderForPath = route.isPrivate
      ? route.whileLoadingAttr
      : route.pageAttr
    if (typeof componentToRenderForPath === 'undefined') continue

    // @TODO
    // help aldo :)
    const compoenentEscaped = componentToRenderForPath
      .getText()
      .replace('{', '')
      .replace('}', '')

    const key = route.path
    lines.push(`
		case ${JSON.stringify(key)}:
			return (${compoenentEscaped});
		`)
  }

  // @TODO
  // aldo, help :D, what context is console.log running in?
  return `
	console.log('xxx', arguments[0].default);
	if (arguments.length > 0 && arguments[0].prerender){
		switch(arguments[0].prerender?.path){
			${lines.join('\n')}
		}
		return undefined
	}
	`
}
