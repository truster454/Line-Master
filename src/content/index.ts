import { detectChessCom } from './detectors/chesscom'
import { detectLichess } from './detectors/lichess'
import type { PositionSnapshot } from '../shared/types'

export async function detectPosition(): Promise<PositionSnapshot | null> {
  if (window.location.hostname.includes('chess.com')) {
    return detectChessCom()
  }
  if (window.location.hostname.includes('lichess.org')) {
    return detectLichess()
  }
  return null
}

async function reportPosition(): Promise<void> {
  const snapshot = await detectPosition()
  if (!snapshot) {
    return
  }
  const runtime = globalThis.chrome?.runtime
  if (runtime?.sendMessage) {
    runtime.sendMessage({ type: 'position:update', payload: snapshot })
  }
}

void reportPosition()
