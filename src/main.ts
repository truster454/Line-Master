import './ui/styles/globals.css'

const root = document.querySelector<HTMLHeadingElement>('.dev-shell h1')
if (root) {
  root.textContent = 'Theory Bot (Dev)'
}
