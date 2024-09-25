import { ClientLanguage } from '../../../i18n'
import { Group } from './group'
import { PermissionList } from './permissionList'
import { AuthOrganization } from '.'

export interface User {
  /**
   * The unique identifier
   */
  id: string
  /**
   * The related email address. Should be unique
   */
  email: string
  /**
   * The hashed password value
   */
  passwordHash: string
  /**
   * The active client language
   */
  language: ClientLanguage
  /**
   * A language that will be used for data translation
   */
  dataLanguage: ClientLanguage
  /**
   * Optional first name
   */
  firstName?: string
  /**
   * Optional last name
   */
  lastName?: string

  /**
   * Indicates if the user needs a second factor challenge to log in
   */
  isTwoFactorEnabled: boolean

  /**
   * A list of available permissions
   */
  permissions: PermissionList

  /**
   * A list of the user's groups
   */
  groups: Group[]

  /**
   * Phone number
   */
  phone?: string

  /**
   * Phone country code
   */
  phoneCountryCode?: string

  /**
   * Organization of the user, undefined if user does not belong to any organization
   */
  organization?: AuthOrganization
}
