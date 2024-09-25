/**
 * Generic service interface with async init/dispose
 */
export interface DisposableService {
  /**
   * initializes the service
   */
  init: () => Promise<void>
  /**
   * disposes the service (clean up resources, closes connections, etc...)
   */
  dispose: () => Promise<void>
}
