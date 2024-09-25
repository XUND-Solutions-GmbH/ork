/**
 * Minimal Organization interface for authentication
 */
export interface AuthOrganization {
  /**
   * The unique identifier
   */
  id: string
  /**
   * Organization name
   */
  name: string
  /**
   * True if organization is internal
   */
  isInternal: boolean
}
