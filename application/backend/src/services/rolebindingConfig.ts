/* eslint-disable jsdoc/check-param-names */
import _accessConfig from '../accessConfig.json'
import { MissingParamError } from '../errors'
import { CLUSTER_LIST } from './kubernetesService'
import { AuthorizationInfo, EvaluationResult, Evaluator } from './evaluator'
import { RawAccessConfig } from './accessConfigService'

export type RolebindingConfiguration = {
  maxExpiryHours: number
  rolebindings: ClusterPermission[]
}

export const rolebindingConfigExtractor = (raw: RawAccessConfig): RolebindingConfiguration => ({
  maxExpiryHours: raw.maxExpiryHours,
  rolebindings: raw.rolebindings,
})

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

export class RolebindingConfigService implements Evaluator {
  public rolebindingConfig: RolebindingConfiguration
  /**
   * @param {RolebindingConfiguration} rolebindingConfig an object containing the config for rolebind management
   */
  constructor(rolebindingConfig: RolebindingConfiguration) {
    this.rolebindingConfig = rolebindingConfig
  }

  /**
   * @param params.username user to evaluate access for as coming from vouch header
   * @param params.target cluster to evaluate access on
   * @param params.permission role to check authorization for
   * @param params.context ignored
   * @returns allowed access length if allowed, else 0
   */
  implEvaluateAccess =
    () =>
    async (params: {
      username: string
      target?: string
      permission?: string
      context?: Map<string, string>
    }): Promise<EvaluationResult> => {
      if (!params.target) throw new MissingParamError('kubernetes', 'target')
      if (!params.permission) throw new MissingParamError('kubernetes', 'permission')
      const accessLength = this.getUserClusterAccess(params.username, params.target, params.permission)
      if (accessLength) {
        return { expiryHours: accessLength }
      } else {
        return { expiryHours: 0 }
      }
    }

  /**
   * @param params.username user to evaluate access for as coming from vouch header
   * @param params.target cluster to evaluate access on
   * @param params.context ignored
   * @returns list of allowed roles per cluster
   */
  implGetAccessesInfo =
    () =>
    async (params: {
      username: string
      target?: string
      context?: Map<string, string>
    }): Promise<AuthorizationInfo> => {
      if (params.target) {
        const permissions = this.getClusterPermissionsForUser(params.username, params.target)
        return {
          allowedPermissionsPerTarget: [
            {
              target: params.target,
              permissions: permissions.clusterRoles.concat(permissions.roles),
            },
          ],
        }
      } else {
        const permissionsPerTarget = this.getPermissionsForUser(params.username)
        return {
          allowedPermissionsPerTarget: Array.from(permissionsPerTarget).flatMap(([cluster, roles]) =>
            !roles || (roles.clusterRoles.length === 0 && roles.roles.length === 0)
              ? []
              : [{ target: cluster, permissions: roles.clusterRoles.concat(roles.roles) }],
          ),
        }
      }
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
