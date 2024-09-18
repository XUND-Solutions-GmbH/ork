/**
 * Error details can be sent to client using this interface
 */
export interface ErrorDetails {
  /**
   * Localized error message that describes the problem clearly for end users
   */
  userFriendlyDescription?: string

  /**
   * Short description about the problem for developers. It's language is always english
   */
  description?: string

  /**
   * Other details about the error
   */
  data?: unknown
}
