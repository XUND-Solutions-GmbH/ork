import { existsSync } from 'fs'
import { KubeConfig } from '@kubernetes/client-node'
import { ORKError, MissingParamError, InternalServerErrorCode } from '../errors'
import { KubernetesService } from './kubernetesService'
import { RolebindingConfigService } from './rolebindingConfig'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('@kubernetes/client-node', () => ({
  KubeConfig: jest.fn(),
  RbacAuthorizationV1Api: jest.fn(),
  V1ClusterRoleBinding: jest.fn().mockImplementation(() => ({})),
  V1RoleBinding: jest.fn().mockImplementation(() => ({})),
  V1ObjectMeta: jest.fn().mockImplementation(() => ({})),
  V1RoleRef: jest.fn().mockImplementation(() => ({})),
  RbacV1Subject: jest.fn().mockImplementation(() => ({})),
}))

const mockConfig = { environment: 'TEST' } as any

describe('kubernetesService', () => {
  let service: KubernetesService
  let rolebindingConfigService: RolebindingConfigService
  let mockCreateNamespacedRoleBindingWithHttpInfo: jest.Mock
  let mockCreateClusterRoleBindingWithHttpInfo: jest.Mock

  beforeEach(() => {
    ;(existsSync as jest.Mock).mockReturnValue(true)

    mockCreateNamespacedRoleBindingWithHttpInfo = jest.fn().mockResolvedValue({ httpStatusCode: 201 })
    mockCreateClusterRoleBindingWithHttpInfo = jest.fn().mockResolvedValue({ httpStatusCode: 201 })
    ;(KubeConfig as jest.Mock).mockImplementation(() => ({
      loadFromFile: jest.fn(),
      makeApiClient: jest.fn().mockReturnValue({
        createNamespacedRoleBindingWithHttpInfo: mockCreateNamespacedRoleBindingWithHttpInfo,
        createClusterRoleBindingWithHttpInfo: mockCreateClusterRoleBindingWithHttpInfo,
      }),
    }))

    rolebindingConfigService = new RolebindingConfigService({
      rolebindings: [
        {
          user: 'user1@example.com',
          permissions: [
            {
              clusters: ['dev'],
              roleDefinitions: {
                roles: ['developer'],
                clusterRoles: ['cluster-admin'],
              },
            },
          ],
        },
      ],
      maxExpiryHours: 420,
    })

    service = new KubernetesService({ config: mockConfig }, rolebindingConfigService)
  })

  describe('implAuthorize', () => {
    it('Should throw MissingParamError when target is not provided', async () => {
      await expect(service.implAuthorize()({ username: 'user1@example.com', permission: 'developer' })).rejects.toThrow(
        MissingParamError,
      )
    })

    it('Should throw MissingParamError when permission is not provided', async () => {
      await expect(service.implAuthorize()({ username: 'user1@example.com', target: 'dev' })).rejects.toThrow(
        MissingParamError,
      )
    })

    it('Should return AuthorizationResult with correct expiryHours and message on success', async () => {
      const result = await service.implAuthorize()({
        username: 'user1@example.com',
        target: 'dev',
        permission: 'developer',
      })
      expect(result?.expiryHours).toEqual(420)
      expect(result?.message).toContain('expiry: [420 hours]')
    })

    it('Should throw ORKError when the underlying add rolebinding returns a non-201 code', async () => {
      mockCreateNamespacedRoleBindingWithHttpInfo.mockRejectedValue(
        new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.K8sSetupError, {
          description: 'test error',
        }),
      )
      await expect(
        service.implAuthorize()({
          username: 'user1@example.com',
          target: 'dev',
          permission: 'developer',
        }),
      ).rejects.toThrow(ORKError)
    })
  })

  describe('implAddRolebindingToCluster', () => {
    it('Should call createNamespacedRoleBindingWithHttpInfo and return code 201 for a regular role', async () => {
      const result = await service.implAddRolebindingToCluster()({
        cluster: 'dev',
        username: 'user1@example.com',
        role: 'developer',
      })
      expect(mockCreateNamespacedRoleBindingWithHttpInfo).toHaveBeenCalledTimes(1)
      expect(mockCreateClusterRoleBindingWithHttpInfo).not.toHaveBeenCalled()
      expect(result.code).toEqual(201)
    })

    it('Should call createClusterRoleBindingWithHttpInfo and return code 201 for a cluster role', async () => {
      const result = await service.implAddRolebindingToCluster()({
        cluster: 'dev',
        username: 'user1@example.com',
        role: 'cluster-admin',
      })
      expect(mockCreateClusterRoleBindingWithHttpInfo).toHaveBeenCalledTimes(1)
      expect(mockCreateNamespacedRoleBindingWithHttpInfo).not.toHaveBeenCalled()
      expect(result.code).toEqual(201)
    })

    it('Should throw ORKError (K8sSetupError) when the cluster is not in CLUSTER_LIST', async () => {
      await expect(
        service.implAddRolebindingToCluster()({
          cluster: 'unknown-cluster',
          username: 'user1@example.com',
          role: 'developer',
        }),
      ).rejects.toThrow(ORKError)
    })

    it('Should throw ORKError (K8sSetupError) when no kubeconfig file exists for the cluster', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      await expect(
        service.implAddRolebindingToCluster()({
          cluster: 'dev',
          username: 'user1@example.com',
          role: 'developer',
        }),
      ).rejects.toThrow(ORKError)
    })

    it('Should throw ORKError (K8sAuthError) when the user lacks permission for the role on the cluster', async () => {
      await expect(
        service.implAddRolebindingToCluster()({
          cluster: 'dev',
          username: 'user2@example.com',
          role: 'developer',
        }),
      ).rejects.toThrow(ORKError)
    })
  })
})
