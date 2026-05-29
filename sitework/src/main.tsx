import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { migrateLegacyState } from '@/state/migrate-v1'

// One-time import of legacy sw_state_v1 → sw_state_v2 before first render,
// so a returning single-file-app user keeps their data. No-op for fresh users.
migrateLegacyState()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
