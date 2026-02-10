import { createLogger } from '../shared/logger'

const log = createLogger('background')

chrome.runtime.onInstalled.addListener(() => {
  log.info('Service worker installed')
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'ping') {
    sendResponse({ ok: true })
    return true
  }
  if (message?.type === 'position:update') {
    log.info('Received position update', message.payload)
    sendResponse({ ok: true })
    return true
  }
  return false
})
