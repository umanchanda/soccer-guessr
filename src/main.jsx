import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { importTransfer } from './transfer.js'

// Before the app reads storage, so carried-over scores show up on the first render.
importTransfer()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
