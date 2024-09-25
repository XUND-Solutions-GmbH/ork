import { PermissionList } from './permissionList'
import { AuthOrganization, User } from '.'

export interface Group {
  /**
   * The unique identifier
   */
  id: string
  /**
   * The unique group name
   */
  name: string
  /**
   * The group description
   */
  description?: string
  /**
   * A list of available permissions to grant to all members
   */
  permissions: PermissionList
  /**
   * A list of group members
   */
  members: User[]
  /**
   * A list of group organizations
   */
  organizations?: AuthOrganization[]
  /**
   * True if group is internal, and can be given only to internal organizations
   */
  isInternal: boolean
}
