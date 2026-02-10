export interface Logger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export function createLogger(scope: string): Logger {
  return {
    info: (...args) => console.info(`[${scope}]`, ...args),
    warn: (...args) => console.warn(`[${scope}]`, ...args),
    error: (...args) => console.error(`[${scope}]`, ...args)
  }
}

export const logger = createLogger('app')
