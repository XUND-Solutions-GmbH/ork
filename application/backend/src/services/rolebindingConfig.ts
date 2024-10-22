import _accessConfig from '../accessConfig.json'
import { CLUSTER_LIST } from './kubernetesService'

export type RolebindingConfiguration = {
  maxExpiryHours: number
  rolebindings: ClusterPermission[]
}

type ClusterPermission = {
  user: string
  permissions: Array<{
    clusters: string[]
    roleDefinitions: RoleDefinition
  }>
}

type RoleDefinition = {
  roles: string[]
  clusterRoles: string[]
}

export class RolebindingConfigService {
  public rolebindingConfig: RolebindingConfiguration
  /**
   *
   * @param {RolebindingConfiguration} rolebindingConfig an object containing the config for rolebind management
   */
  constructor(rolebindingConfig?: RolebindingConfiguration) {
    this.rolebindingConfig = rolebindingConfig || _accessConfig
  }

  /**
   * A function to get a list of role names for a user for specific cluster
   * @param {string} username the name of the user
   * @param {string} cluster the name of the cluster
   * @returns {string[]} a list of role names
   */
  public getClusterPermissionsForUser(username: string, cluster: string): RoleDefinition {
    const userPermissions = this.rolebindingConfig.rolebindings.find((cp) => cp.user === username)
    if (userPermissions === undefined) {
      return {
        roles: [],
        clusterRoles: [],
      }
    }

    const userClusterPermissions = userPermissions.permissions
      .filter((p) => p.clusters.includes(cluster))
      .map((p) => ({ roles: p.roleDefinitions.roles, clusterRoles: p.roleDefinitions.clusterRoles }))
      .reduce(
        (a, c) => {
          const ret: RoleDefinition = {
            roles: c.roles,
            clusterRoles: c.clusterRoles,
          }
          ret.clusterRoles = [...new Set(ret.clusterRoles.concat(a.clusterRoles))]
          ret.roles = [...new Set(ret.roles.concat(a.roles))]
          return ret
        },
        {
          roles: [],
          clusterRoles: [],
        },
      )
    return userClusterPermissions
  }

  /**
   * A function to get a list of role names for a user
   * @param {string} username the name of the user
   * @returns {string[]} a list of role names
   */
  public getPermissionsForUser(username: string): Map<string, RoleDefinition> {
    const clusterPermissions = new Map<string, RoleDefinition>()
    for (const cluster of CLUSTER_LIST) {
      const roles = this.getClusterPermissionsForUser(username, cluster)
      clusterPermissions.set(cluster, roles)
    }
    return clusterPermissions
  }

  /**
   * A function to check user permission on a specific cluster
   * @param {string} username name of the user
   * @param {string} cluster name of the cluster
   * @param {string} role name of the role to check
   * @returns {number} the number minutes user permission to access, -1 if not
   */
  public getUserClusterAccess(username: string, cluster: string, role: string): number | undefined {
    const userPermissions = this.getClusterPermissionsForUser(username, cluster)
    if (userPermissions.roles.includes(role) || userPermissions.clusterRoles.includes(role))
      return this.rolebindingConfig.maxExpiryHours

    return undefined
  }
}
