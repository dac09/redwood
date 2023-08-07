import React from 'react'

import { createPortal } from 'react-dom'

import { useServerInsertedHTML } from './ServerInject'

const PortalHead: React.FC<React.PropsWithChildren> = ({ children }) => {
  useServerInsertedHTML(() => {
    // Add "data-rwjs-head" attribute to anything inside <PortalHead>,
    // This is then later moved to the <head> in the final block of the transform stream (see streamHelpers.ts)
    return React.Children.toArray(children).map((child, index) => {
      return React.cloneElement(child as React.ReactElement, {
        'data-rwjs-head': `bazinga-${index}`,
      })
    })
  })

  if (typeof window === 'undefined') {
    // Don't do anything on the server, handled by above callback
    return null
  } else {
    return createPortal(<>{children}</>, document.head)
  }
}

export default PortalHead
