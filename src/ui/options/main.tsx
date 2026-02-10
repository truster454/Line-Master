import '../styles/globals.css'
import { createRoot } from 'react-dom/client'
import { Options } from './Options'

const container = document.getElementById('app')
if (container) {
  createRoot(container).render(<Options />)
}
