import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './stores/AuthContext'
import './styles/index.css'

// Apply saved theme before first paint
const stored = localStorage.getItem('ocs_theme')
document.documentElement.setAttribute('data-theme', stored === 'light' ? 'light' : 'dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
