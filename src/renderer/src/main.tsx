import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import MiniPlayerApp from './MiniPlayerApp'
import './styles.css'

// Same bundle for both windows; the mini-player window loads with #mini.
const Root = location.hash === '#mini' ? MiniPlayerApp : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
