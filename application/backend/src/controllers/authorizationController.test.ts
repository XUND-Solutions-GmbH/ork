import { InternalServerErrorCode, ORKError } from '../errors'
import { AuthorizationController } from './authorizationController'

const mockConfig = { environment: 'TEST' } as any

describe('authorizationController', () => {
  let controller: AuthorizationController
  let mockEvaluateAccess: jest.Mock
  let mockGetAccessesInfo: jest.Mock
  let mockAuthorize: jest.Mock
  let mockEvaluator: { implEvaluateAccess: jest.Mock; implGetAccessesInfo: jest.Mock }
  let mockAuthorizer: { implAuthorize: jest.Mock }

  beforeEach(() => {
    mockEvaluateAccess = jest.fn()
    mockGetAccessesInfo = jest.fn()
    mockAuthorize = jest.fn()
    mockEvaluator = {
      implEvaluateAccess: jest.fn().mockReturnValue(mockEvaluateAccess),
      implGetAccessesInfo: jest.fn().mockReturnValue(mockGetAccessesInfo),
    }
    mockAuthorizer = {
      implAuthorize: jest.fn().mockReturnValue(mockAuthorize),
    }
    controller = new AuthorizationController({ config: mockConfig })
    controller.addChain('kubernetes', mockAuthorizer as any, [mockEvaluator as any])
  })

  describe('implAuthorizeUser', () => {
    it('Should return undefined when no chain is registered for the area', async () => {
      const result = await controller.implAuthorizeUser()({ area: 'unknown', username: 'user1' })
      expect(result).toBeUndefined()
    })

    it('Should return undefined when the authorizer returns undefined', async () => {
      mockEvaluateAccess.mockResolvedValue({ expiryHours: undefined })
      mockAuthorize.mockResolvedValue(undefined)
      const result = await controller.implAuthorizeUser()({ area: 'kubernetes', username: 'user1' })
      expect(result).toBeUndefined()
    })

    it('Should return expiryHours 0 with the evaluator name and not call the authorizer when an evaluator returns 0', async () => {
      mockEvaluateAccess.mockResolvedValue({ expiryHours: 0 })
      const result = await controller.implAuthorizeUser()({ area: 'kubernetes', username: 'user1' })
      expect(result).toEqual({ expiryHours: 0, message: 'Object' })
      expect(mockAuthorize).not.toHaveBeenCalled()
    })

    it('Should call the authorizer with undefined expiry when all evaluators return expiryHours undefined', async () => {
      mockEvaluateAccess.mockResolvedValue({ expiryHours: undefined })
      mockAuthorize.mockResolvedValue({ expiryHours: 10, message: 'authorized' })
      await controller.implAuthorizeUser()({ area: 'kubernetes', username: 'user1' })
      expect(mockAuthorize).toHaveBeenCalledWith(expect.objectContaining({ expiry: undefined }))
    })

    it('Should pass the minimum expiry to the authorizer when multiple evaluators return different values', async () => {
      const mockEvaluateAccess2 = jest.fn().mockResolvedValue({ expiryHours: 5 })
      const mockEvaluator2 = {
        implEvaluateAccess: jest.fn().mockReturnValue(mockEvaluateAccess2),
        implGetAccessesInfo: jest.fn(),
      }
      mockEvaluateAccess.mockResolvedValue({ expiryHours: 10 })
      controller.addChain('kubernetes', mockAuthorizer as any, [mockEvaluator as any, mockEvaluator2 as any])
      mockAuthorize.mockResolvedValue({ expiryHours: 5, message: 'authorized' })
      await controller.implAuthorizeUser()({ area: 'kubernetes', username: 'user1' })
      expect(mockAuthorize).toHaveBeenCalledWith(expect.objectContaining({ expiry: 5 }))
    })

    it('Should return the authorization result from the authorizer on success', async () => {
      mockEvaluateAccess.mockResolvedValue({ expiryHours: 8 })
      mockAuthorize.mockResolvedValue({ expiryHours: 8, message: 'User added to cluster' })
      const result = await controller.implAuthorizeUser()({ area: 'kubernetes', username: 'user1' })
      expect(result).toEqual({ expiryHours: 8, message: 'User added to cluster' })
    })

    it('Should return expiryHours 0 with the area name when the authorizer returns expiryHours <= 0', async () => {
      mockEvaluateAccess.mockResolvedValue({ expiryHours: 8 })
      mockAuthorize.mockResolvedValue({ expiryHours: 0, message: 'denied' })
      const result = await controller.implAuthorizeUser()({ area: 'kubernetes', username: 'user1' })
      expect(result).toEqual({ expiryHours: 0, message: 'kubernetes' })
    })

    it('Should re-throw a ORKError from an evaluator', async () => {
      mockEvaluateAccess.mockRejectedValue(
        new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.UnknownError),
      )
      await expect(controller.implAuthorizeUser()({ area: 'kubernetes', username: 'user1' })).rejects.toThrow(ORKError)
    })

    it('Should re-throw a non-ORKError from an evaluator', async () => {
      mockEvaluateAccess.mockRejectedValue(new Error('Unexpected'))
      await expect(controller.implAuthorizeUser()({ area: 'kubernetes', username: 'user1' })).rejects.toThrow(Error)
    })
  })

  describe('implGetChainInfo', () => {
    it('Should return undefined when no chain is registered for the area', async () => {
      const result = await controller.implGetChainInfo()({ area: 'unknown', username: 'user1' })
      expect(result).toBeUndefined()
    })

    it('Should call implGetAccessesInfo with the correct username and target', async () => {
      mockGetAccessesInfo.mockResolvedValue({ allowedPermissionsPerTarget: undefined })
      await controller.implGetChainInfo()({ area: 'kubernetes', username: 'user1', target: 'dev' })
      expect(mockGetAccessesInfo).toHaveBeenCalledWith({ username: 'user1', target: 'dev' })
    })

    it('Should return the combined AuthorizationInfo from all evaluators', async () => {
      mockGetAccessesInfo.mockResolvedValue({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view'] }],
      })
      const result = await controller.implGetChainInfo()({ area: 'kubernetes', username: 'user1' })
      expect(result).toEqual({ allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view'] }] })
    })
  })

  describe('reduceAuthorizationInfos (via implGetChainInfo)', () => {
    it('Should return allowedPermissionsPerTarget undefined when all evaluators return undefined', async () => {
      mockGetAccessesInfo.mockResolvedValue({ allowedPermissionsPerTarget: undefined })
      const result = await controller.implGetChainInfo()({ area: 'kubernetes', username: 'user1' })
      expect(result).toEqual({ allowedPermissionsPerTarget: undefined })
    })

    it('Should return the defined permissions when only one evaluator has permissions and the other returns undefined', async () => {
      const mockGetAccessesInfo2 = jest.fn().mockResolvedValue({ allowedPermissionsPerTarget: undefined })
      const mockEvaluator2 = {
        implEvaluateAccess: jest.fn(),
        implGetAccessesInfo: jest.fn().mockReturnValue(mockGetAccessesInfo2),
      }
      controller.addChain('kubernetes', mockAuthorizer as any, [mockEvaluator as any, mockEvaluator2 as any])
      mockGetAccessesInfo.mockResolvedValue({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view', 'edit'] }],
      })
      const result = await controller.implGetChainInfo()({ area: 'kubernetes', username: 'user1' })
      expect(result).toEqual({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view', 'edit'] }],
      })
    })

    it('Should return the intersection of permissions from multiple evaluators for the same target', async () => {
      const mockGetAccessesInfo2 = jest.fn().mockResolvedValue({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view', 'delete'] }],
      })
      const mockEvaluator2 = {
        implEvaluateAccess: jest.fn(),
        implGetAccessesInfo: jest.fn().mockReturnValue(mockGetAccessesInfo2),
      }
      controller.addChain('kubernetes', mockAuthorizer as any, [mockEvaluator as any, mockEvaluator2 as any])
      mockGetAccessesInfo.mockResolvedValue({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view', 'edit'] }],
      })
      const result = await controller.implGetChainInfo()({ area: 'kubernetes', username: 'user1' })
      expect(result).toEqual({ allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view'] }] })
    })

    it('Should treat permissions undefined from one evaluator as allow-all and defer to the other evaluator', async () => {
      const mockGetAccessesInfo2 = jest.fn().mockResolvedValue({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view', 'edit'] }],
      })
      const mockEvaluator2 = {
        implEvaluateAccess: jest.fn(),
        implGetAccessesInfo: jest.fn().mockReturnValue(mockGetAccessesInfo2),
      }
      controller.addChain('kubernetes', mockAuthorizer as any, [mockEvaluator as any, mockEvaluator2 as any])
      mockGetAccessesInfo.mockResolvedValue({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: undefined }],
      })
      const result = await controller.implGetChainInfo()({ area: 'kubernetes', username: 'user1' })
      expect(result).toEqual({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view', 'edit'] }],
      })
    })

    it('Should return empty permissions when no permissions overlap between evaluators', async () => {
      const mockGetAccessesInfo2 = jest.fn().mockResolvedValue({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['edit'] }],
      })
      const mockEvaluator2 = {
        implEvaluateAccess: jest.fn(),
        implGetAccessesInfo: jest.fn().mockReturnValue(mockGetAccessesInfo2),
      }
      controller.addChain('kubernetes', mockAuthorizer as any, [mockEvaluator as any, mockEvaluator2 as any])
      mockGetAccessesInfo.mockResolvedValue({
        allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view'] }],
      })
      const result = await controller.implGetChainInfo()({ area: 'kubernetes', username: 'user1' })
      expect(result).toEqual({ allowedPermissionsPerTarget: [{ target: 'dev', permissions: [] }] })
    })
  })
})
