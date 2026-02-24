/* eslint-disable jsdoc/check-param-names */
import os from 'os'
import { existsSync } from 'fs'
import {
  KubeConfig,
  RbacAuthorizationV1Api,
  V1ClusterRoleBinding,
  V1ObjectMeta,
  V1RoleRef,
  RbacV1Subject,
  V1RoleBinding,
} from '@kubernetes/client-node'
import moment from 'moment'
import { Logger } from '../../../logger'
import { ORKError, InternalServerErrorCode, MissingParamError } from '../errors'
import { ConfigValues } from '../services/config'
import { RolebindingConfigService } from './rolebindingConfig'
import { getLoggerForService } from './logger'
import { AuthorizationResult } from '../../../common/src'
import { Authorizer } from './authorizer'


type AddRoleBindingResponse = {
  code: number
  data: {
    result: {
      status: string
      data?: string
    }
  }
}

export const CLUSTER_LIST = ['dev']

export class KubernetesService implements Authorizer {
  static readonly AREA_NAME = 'kubernetes'
  public readonly logger: Logger
  private readonly rolebindingConfigService: RolebindingConfigService
  private k8sApi?: RbacAuthorizationV1Api

  /**
   * @param options The service configuration object
   * @param {ConfigValues} options.config The application config
   * @param {RolebindingConfigService} rolebindingConfigService a service to handle the configuration on rolebindings
   */
  constructor(options: { config: ConfigValues }, rolebindingConfigService?: RolebindingConfigService) {
    this.rolebindingConfigService = rolebindingConfigService || new RolebindingConfigService()
    this.logger = getLoggerForService(this, options.config)
  }

  /**
   * @param cluster name of the cluster
   */
  private makeApiClient(cluster: string): void {
    if (!CLUSTER_LIST.includes(cluster)) {
      throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.K8sSetupError, {
        description: `Unknown cluster name [${cluster}]`,
      })
    }

    const configFile = `${os.homedir()}/.kube/config-${cluster}`
    if (!existsSync(configFile)) {
      throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.K8sSetupError, {
        description: `No k8s config file found for cluster [${cluster}]`,
      })
    }

    const kc = new KubeConfig()
    kc.loadFromFile(configFile)
    this.k8sApi = kc.makeApiClient(RbacAuthorizationV1Api)
  }

  /**
   * @param role name of the role
   * @returns true if role should be a clusterRole
   */
  private isClusterRole(role: string): boolean {
    return role.startsWith('cluster') || role.startsWith('devops') || role.startsWith('rbac')
  }

  /**
 * @param params.username user to be authorized as coming from vouch header
 * @param params.target cluster to authorize for
 * @param params.permission role to be added
 * @param params.expiry time to authorize for
 * @returns Authorization result if successful
 */
  implAuthorize =
    () =>
      async (params: {
        username: string
        target?: string
        permission?: string
        expiry?: number
      }): Promise<AuthorizationResult | undefined> => {
        this.logger.debug({
          message: `Authorization for target: ${params.target}, permission ${params.permission}, user ${params.username}`,
        })
        if (!params.target || !params.permission)
          throw new MissingParamError(KubernetesService.AREA_NAME, params.target ? 'permission' : 'target')
        const addRolebinding = this.implAddRolebindingToCluster()
        const addRolebindingResponse = await addRolebinding({
          cluster: params.target,
          username: params.username,
          role: params.permission,
        })
        this.logger.debug({
          message: `Authorization result from kubernetes (${addRolebindingResponse.code}) ${addRolebindingResponse.data.result.data}`,
        })
        if (addRolebindingResponse.code === 201) {
          const regex = /expiry:\s*\[(\d+)\s*hours\]/
          const match = addRolebindingResponse.data.result.data?.match(regex)

          if (addRolebindingResponse.data.result.data && match) {
            const expiry = parseInt(match[1], 10)
            return { expiryHours: expiry, message: addRolebindingResponse.data.result.data }
          } else {
            throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.UnknownError, {
              description: 'Unknown error when getting expiry time from result',
              data: addRolebindingResponse.data.result.status,
            })
          }
        } else {
          throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.UnknownError, {
            description: 'Unknown error when adding user to cluster',
            data: addRolebindingResponse.code,
          })
        }
      }

  /**
  * @param params.username user to be authorized
  * @param params.cluster cluster to authorize for
  * @param params.role role to be added
  * @returns status code for successful binding or typical errors
  */
  implAddRolebindingToCluster =
    () =>
      async (params: { cluster: string; username: string; role: string }): Promise<AddRoleBindingResponse> => {
        this.makeApiClient(params.cluster)
        if (!this.k8sApi) {
          throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.K8sSetupError, {
            description: `Something went wrong when setting up connection for cluster [${params.cluster}]`,
          })
        }

        const accessLength = this.rolebindingConfigService.getUserClusterAccess(
          params.username,
          params.cluster,
          params.role,
        )
        if (accessLength === undefined) {
          throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.K8sAuthError, {
            description: `User [${params.username}] doesn't have permission to use role [${params.role}] in cluster [${params.cluster}]`,
          })
        }
        try {
          const binding = this.isClusterRole(params.role) ? new V1ClusterRoleBinding() : new V1RoleBinding()

          binding.metadata = new V1ObjectMeta()
          binding.metadata.name = `XAUTHZ_${moment()
            .add(accessLength, 'hours')
            .format('YYYYMMDDHHmmss')
            .toString()}_${params.username.substring(0, 2)}`
          binding.roleRef = new V1RoleRef()
          binding.roleRef.name = params.role
          binding.roleRef.apiGroup = 'rbac.authorization.k8s.io'
          binding.roleRef.kind = this.isClusterRole(params.role) ? 'ClusterRole' : 'Role'
          const sbj: RbacV1Subject = new RbacV1Subject()
          sbj.kind = 'User'
          sbj.name = params.username
          binding.subjects = [sbj]

          const rolebindingResponse = this.isClusterRole(params.role)
            ? await this.k8sApi.createClusterRoleBindingWithHttpInfo({
              body: binding as V1ClusterRoleBinding,
            })
            : await this.k8sApi.createNamespacedRoleBindingWithHttpInfo({
              namespace: 'default',
              body: binding as V1RoleBinding,
            })

          this.logger.info({
            message: `Add user [${params.username}] to cluster [${params.cluster}] with role: [${params.role}]`,
          })
          return {
            code: 201,
            data: {
              result: {
                status: rolebindingResponse.httpStatusCode.toString(),
                data: `User [${params.username}] added to role [${params.role}] in cluster [${params.cluster}], expiry: [${accessLength} hours]`,
              },
            },
          }
        } catch (err) {
          if (err instanceof ORKError && err.internalServerErrorCode === InternalServerErrorCode.K8sAuthError) {
            const res = {
              code: 403,
              data: {
                result: {
                  status: 'fail',
                  data: err.details?.description,
                },
              },
            }
            return res
          }
          if (err instanceof ORKError && err.internalServerErrorCode === InternalServerErrorCode.K8sSetupError) {
            const res = {
              code: 400,
              data: {
                result: {
                  status: 'fail',
                  data: err.details?.description,
                },
              },
            }
            return res
          }
          throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.UnknownError, {
            description: 'Unknown error when adding rolebinding to Kubernetes',
            data: err,
          })
        }
      }

  /**
   * @returns Number of bindings deleted
   */
  implCleanExpiredRolebinding = () => async (): Promise<number> => {
    const now = moment()
    let deleted = 0
    const failed: string[] = []
    for (const c of CLUSTER_LIST) {
      try {
        this.makeApiClient(c)
        if (!this.k8sApi) {
          throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.K8sSetupError, {
            description: `Something went wrong when setting up connection for cluster [${c}]`,
          })
        }

        const clusterRoleBindings = await this.k8sApi.listClusterRoleBinding()
        for (const binding of clusterRoleBindings.items) {
          if (
            binding.metadata?.name &&
            binding.metadata.name.startsWith('XAUTHZ') &&
            moment(binding.metadata.name.split('_')[1], 'YYYYMMDDHHmmss').isBefore(now)
          ) {
            try {
              await this.k8sApi.deleteClusterRoleBinding({ name: binding.metadata.name })
              deleted++
            } catch (err) {
              failed.push(binding.metadata.name)
            }
          }
        }

        const roleBindings = await this.k8sApi.listNamespacedRoleBinding({ namespace: 'default' })
        for (const rb of roleBindings.items) {

          if (
            rb.metadata?.name &&
            rb.metadata.name.startsWith('XAUTHZ') &&
            moment(rb.metadata.name.split('_')[1], 'YYYYMMDDHHmmss').isBefore(now)
          ) {
            try {
              await this.k8sApi.deleteNamespacedRoleBinding({ name: rb.metadata.name, namespace: 'default' })
              deleted++
            } catch (err) {
              failed.push(rb.metadata.name)
            }
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          this.logger.error({
            message: `Error during scheduled job in cluster ${c}: ${err.message}`,
            error: err,
          })
        } else {
          this.logger.error({
            message: `Unknown error during scheduled job in cluster ${c}`,
            error: new Error(err as string),
          })
        }
      }
    }
    if (failed.length !== 0) {
      this.logger.warn({
        message: `Failed to delete rolebindings: ${failed.join(',')}`,
      })
    }
    return deleted
  }
}
