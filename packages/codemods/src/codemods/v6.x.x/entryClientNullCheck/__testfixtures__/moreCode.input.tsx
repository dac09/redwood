import { hydrateRoot, createRoot } from 'react-dom/client'

import App from './App'
/**
 * When `#redwood-app` isn't empty then it's very likely that you're using
 * prerendering. So React attaches event listeners to the existing markup
 * rather than replacing it.
 * https://reactjs.org/docs/react-dom-client.html#hydrateroot
 */
const redwoodAppElement = document.getElementById('redwood-app')

// Some random additional user code
if(Math.random() > 0.5){
  console.log("Some random code execution...")
}else{
  console.log("There are", redwoodAppElement.children?.length, "div children in the redwood-app element.")
}

if (redwoodAppElement.children?.length > 0) {
  hydrateRoot(redwoodAppElement, <App />)
} else {
  const root = createRoot(redwoodAppElement)
  root.render(<App />)
}
