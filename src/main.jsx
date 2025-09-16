import React from 'react'
import { createRoot } from 'react-dom/client'

console.log('main.jsx is loading...')

const App = () => {
  console.log('App component is rendering...')
  return <div><h1>Hello World - React is working!</h1></div>
}

console.log('About to find root element...')
const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (rootElement) {
  const root = createRoot(rootElement)
  console.log('Root created, about to render...')
  root.render(<App />)
  console.log('Render called!')
} else {
  console.error('Could not find root element!')
}