export interface LogMessage {
  message: string
}

export interface ErrorLogMessage extends LogMessage {
  error: Error
}

export type LogMethod = <T extends LogMessage>(msg: T) => void

export type ErrorLogMethod = <T extends ErrorLogMessage>(msg: T) => void

export interface Logger {
  debug: LogMethod
  info: LogMethod
  warn: LogMethod
  error: ErrorLogMethod
  scope: string
  dispose?: () => void
}
