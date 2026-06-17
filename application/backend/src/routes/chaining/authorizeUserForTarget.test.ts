import { InternalServerErrorCode, MissingParamError, ORKError } from '../../errors'
import { createAuthorizeUserForTarget } from './authorizeUserForTarget'

const urlParameters = { area: 'kubernetes', target: 'dev' }

const makeRequest = (overrides?: { headers?: Record<string, string>; body?: Record<string, unknown> }) => ({
  headers: { 'x-vouch-user': 'user1@example.com', ...overrides?.headers },
  body: { permission: 'developer', ...overrides?.body },
})

describe('createAuthorizeUserForTarget', () => {
  let mockAuthorizeUser: jest.Mock
  let mockController: { implAuthorizeUser: jest.Mock }

  beforeEach(() => {
    mockAuthorizeUser = jest.fn()
    mockController = { implAuthorizeUser: jest.fn().mockReturnValue(mockAuthorizeUser) }
  })

  const callEndpoint = (
    requestOverrides?: { headers?: Record<string, string>; body?: Record<string, unknown> },
    urlParams = urlParameters,
  ) => {
    const endpoint = createAuthorizeUserForTarget(mockController as any)
    return endpoint({
      request: makeRequest(requestOverrides),
      response: {},
      urlParameters: urlParams,
    } as any)
  }

  it('Should return 404 when implAuthorizeUser returns undefined', async () => {
    mockAuthorizeUser.mockResolvedValue(undefined)
    const result = await callEndpoint()
    expect(result).toEqual({ code: 404, data: {} })
  })

  it('Should return 403 with the message when implAuthorizeUser returns expiryHours 0', async () => {
    mockAuthorizeUser.mockResolvedValue({ expiryHours: 0, message: 'AccessDenied' })
    const result = await callEndpoint()
    expect(result).toEqual({ code: 403, data: { data: 'AccessDenied' } })
  })

  it('Should return 201 with stringified expiryHours when authorization succeeds', async () => {
    mockAuthorizeUser.mockResolvedValue({ expiryHours: 8, message: 'User added' })
    const result = await callEndpoint()
    expect(result).toEqual({ code: 201, data: { data: '8' } })
  })

  it('Should return 400 with the error description when a MissingParamError is thrown', async () => {
    const missingParamError = new MissingParamError('kubernetes', 'target')
    mockAuthorizeUser.mockRejectedValue(missingParamError)
    const result = await callEndpoint()
    expect(result).toEqual({
      code: 400,
      data: {
        result: {
          status: missingParamError.integrationErrorType!.toString(),
          data: missingParamError.details?.description,
        },
      },
    })
  })

  it('Should re-throw non-MissingParamError errors from implAuthorizeUser', async () => {
    mockAuthorizeUser.mockRejectedValue(
      new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.UnknownError),
    )
    await expect(callEndpoint()).rejects.toThrow(ORKError)
  })

  it('Should re-throw ORKError from getUserFromHeader when the vouch header is missing', async () => {
    await expect(callEndpoint({ headers: { 'x-vouch-user': '' } })).rejects.toThrow(ORKError)
  })

  it('Should pass context as a Map when request.body.context is provided', async () => {
    mockAuthorizeUser.mockResolvedValue({ expiryHours: 8, message: 'ok' })
    await callEndpoint({ body: { permission: 'developer', context: { environment: 'prod' } } })
    expect(mockAuthorizeUser).toHaveBeenCalledWith(
      expect.objectContaining({ context: new Map([['environment', 'prod']]) }),
    )
  })

  it('Should pass undefined context when request.body.context is not provided', async () => {
    mockAuthorizeUser.mockResolvedValue({ expiryHours: 8, message: 'ok' })
    await callEndpoint()
    expect(mockAuthorizeUser).toHaveBeenCalledWith(expect.objectContaining({ context: undefined }))
  })
})
