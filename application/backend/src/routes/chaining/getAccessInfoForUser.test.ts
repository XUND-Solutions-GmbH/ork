import { ORKError } from '../../errors'
import { createGetAccessInfoForUsers } from './getAccessInfoForUser'

const defaultUrlParameters = { area: 'kubernetes', target: 'dev' }

const makeRequest = (overrides?: { headers?: Record<string, string> }) => ({
  headers: { 'x-vouch-user': 'user1@example.com', ...overrides?.headers },
  body: {},
})

describe('createGetAccessInfoForUsers', () => {
  let mockGetChainInfo: jest.Mock
  let mockController: { implGetChainInfo: jest.Mock }

  beforeEach(() => {
    mockGetChainInfo = jest.fn()
    mockController = { implGetChainInfo: jest.fn().mockReturnValue(mockGetChainInfo) }
  })

  const callEndpoint = (
    urlParameters: Record<string, string | undefined> = defaultUrlParameters,
    requestOverrides?: { headers?: Record<string, string> },
  ) => {
    const endpoint = createGetAccessInfoForUsers(mockController as any)
    return endpoint({
      request: makeRequest(requestOverrides),
      response: {},
      urlParameters,
    } as any)
  }

  it('Should return 404 when implGetChainInfo returns undefined', async () => {
    mockGetChainInfo.mockResolvedValue(undefined)
    const result = await callEndpoint()
    expect(result).toEqual({ code: 404, data: {} })
  })

  it('Should return 200 with only area when allowedPermissionsPerTarget is undefined', async () => {
    mockGetChainInfo.mockResolvedValue({ allowedPermissionsPerTarget: undefined })
    const result = await callEndpoint()
    expect(result).toEqual({ code: 200, data: { permissions: { area: 'kubernetes' } } })
  })

  it('Should return 200 with all targets listed and permissions flattened when no target is in the URL', async () => {
    mockGetChainInfo.mockResolvedValue({
      allowedPermissionsPerTarget: [
        { target: 'dev', permissions: ['view'] },
        { target: 'uat', permissions: ['edit'] },
      ],
    })
    const result = await callEndpoint({ area: 'kubernetes' })
    expect(result).toEqual({
      code: 200,
      data: {
        permissions: {
          area: 'kubernetes',
          target: ['dev', 'uat'],
          permissions: ['view', 'edit'],
        },
      },
    })
  })

  it('Should return 200 with target wrapped in a single-element array when target is provided in the URL', async () => {
    mockGetChainInfo.mockResolvedValue({
      allowedPermissionsPerTarget: [{ target: 'dev', permissions: ['view', 'edit'] }],
    })
    const result = await callEndpoint({ area: 'kubernetes', target: 'dev' })
    expect(result).toEqual({
      code: 200,
      data: {
        permissions: {
          area: 'kubernetes',
          target: ['dev'],
          permissions: ['view', 'edit'],
        },
      },
    })
  })

  it('Should exclude entries with undefined permissions from the flattened permissions array', async () => {
    mockGetChainInfo.mockResolvedValue({
      allowedPermissionsPerTarget: [
        { target: 'dev', permissions: ['view'] },
        { target: 'uat', permissions: undefined },
      ],
    })
    const result = await callEndpoint({ area: 'kubernetes' })
    expect(result).toEqual({
      code: 200,
      data: {
        permissions: {
          area: 'kubernetes',
          target: ['dev', 'uat'],
          permissions: ['view'],
        },
      },
    })
  })

  it('Should re-throw ORKError from getUserFromHeader when the vouch header is missing', async () => {
    await expect(callEndpoint(defaultUrlParameters, { headers: { 'x-vouch-user': '' } })).rejects.toThrow(ORKError)
  })
})
