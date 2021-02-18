import ReactDOM from 'react-dom'

import App from '.'

import './index.css'

const rootElement = document.getElementById('redwood-app')

if (rootElement.hasChildNodes()) {
  ReactDOM.hydrate(<App />, rootElement)
} else {
  ReactDOM.render(<App />, rootElement)
}
