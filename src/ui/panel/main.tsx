import '../styles/globals.css'
import { createRoot } from 'react-dom/client'
import { Panel } from './Panel'

const container = document.getElementById('app')
if (container) {
  createRoot(container).render(<Panel />)
}
