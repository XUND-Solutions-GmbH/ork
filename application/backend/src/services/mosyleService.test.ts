import { AxiosError, AxiosInstance } from 'axios'
import { ConfigurationError, InternalServerErrorCode, MissingParamError } from '../errors'
import { MosyleAccessConfig, MosyleService } from './mosyleService'

const mockMosyleAccessConfig: MosyleAccessConfig = {
  enforcement: [{ area: 'kubernetes', targets: ['beta', 'class2'] }],
  maxExpiryHours: 4,
}

const mockConfig = {
  environment: 'TEST',
  mosyleAccessToken: 'test-access-token',
  mosyleUser: 'user@example.com',
  mosylePass: 'password123',
} as any

const devicesResponse = {
  status: 'OK',
  response: [
    {
      devices: [
        {
          device_name: 'Mac-12345678X',
          device_type: 'COMPUTER',
          serial_number: '12345678X',
          DeviceAttestationStatus: 'Compliant',
          useremail: 'smith@ork.ai',
          enrollment_type: '1:1',
          userid: 'smith',
          username: 'John Smith',
          usertype: 'End User',
        },
      ],
      rows: 1,
      page_size: 50,
      page: 1,
    },
  ],
}

describe('mosyleService', () => {
  let service: MosyleService
  let mockPost: jest.Mock
  let mockMosyleApi: AxiosInstance
  let mockJwtToken: string

  beforeEach(() => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    const jwtPayload = Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64url')
    mockJwtToken = `header.${jwtPayload}.signature`

    mockPost = jest.fn().mockImplementation((url: string) => {
      if (url.includes('login')) {
        return Promise.resolve({
          status: 200,
          headers: { authorization: `Bearer ${mockJwtToken}` },
        })
      }
      return Promise.resolve({ status: 200, data: devicesResponse })
    })

    mockMosyleApi = { post: mockPost } as unknown as AxiosInstance
    service = new MosyleService({ config: mockConfig, mosyleAccessConfig: mockMosyleAccessConfig }, mockMosyleApi)
  })

  it('Should throw ConfigurationError when Mosyle credentials are missing from config', () => {
    expect(
      () => new MosyleService({ config: { environment: 'TEST' } as any, mosyleAccessConfig: mockMosyleAccessConfig }),
    ).toThrow(ConfigurationError)
  })

  describe('implGetAccessesInfo', () => {
    it('Should return allowedPermissionsPerTarget as undefined', async () => {
      const result = await service.implGetAccessesInfo()()
      expect(result).toEqual({ allowedPermissionsPerTarget: undefined })
    })
  })

  describe('implEvaluateAccess', () => {
    it('Should throw MissingParamError when area is not provided', async () => {
      await expect(service.implEvaluateAccess()({ username: 'smith@ork.ai' })).rejects.toThrow(MissingParamError)
    })

    it('Should throw MissingParamError when target is not provided for an area that requires it', async () => {
      await expect(service.implEvaluateAccess()({ username: 'smith@ork.ai', area: 'kubernetes' })).rejects.toThrow(
        MissingParamError,
      )
    })

    it('Should return expiryHours undefined when target is not in the mosyle enforcement list for the area', async () => {
      const result = await service.implEvaluateAccess()({
        username: 'smith@ork.ai',
        area: 'kubernetes',
        target: 'dev',
      })
      expect(result).toEqual({ expiryHours: undefined })
    })

    it('Should throw MissingParamError when context is not provided', async () => {
      await expect(
        service.implEvaluateAccess()({ username: 'smith@ork.ai', area: 'kubernetes', target: 'beta' }),
      ).rejects.toThrow(MissingParamError)
    })

    it('Should throw MissingParamError when serialNumber is not in context', async () => {
      await expect(
        service.implEvaluateAccess()({
          username: 'smith@ork.ai',
          area: 'kubernetes',
          target: 'beta',
          context: new Map([['otherKey', 'value']]),
        }),
      ).rejects.toThrow(MissingParamError)
    })

    it('Should return maxExpiryHours when the serial number matches the user device', async () => {
      const result = await service.implEvaluateAccess()({
        username: 'smith@ork.ai',
        area: 'kubernetes',
        target: 'beta',
        context: new Map([['serialNumber', '12345678X']]),
      })
      expect(result).toEqual({ expiryHours: 4 })
    })

    it('Should return expiryHours 0 when the serial number does not match the user device', async () => {
      const result = await service.implEvaluateAccess()({
        username: 'smith@ork.ai',
        area: 'kubernetes',
        target: 'beta',
        context: new Map([['serialNumber', 'WRONG-SERIAL']]),
      })
      expect(result).toEqual({ expiryHours: 0 })
    })

    it('Should return expiryHours 0 when the user is not found in the device list', async () => {
      const result = await service.implEvaluateAccess()({
        username: 'unknown@ork.ai',
        area: 'kubernetes',
        target: 'beta',
        context: new Map([['serialNumber', '12345678X']]),
      })
      expect(result).toEqual({ expiryHours: 0 })
    })

    it('Should throw XUNDError (AnyInternalConnectionError) when the Mosyle API returns an AxiosError', async () => {
      mockPost.mockRejectedValue(new AxiosError('Network error'))
      await expect(
        service.implEvaluateAccess()({
          username: 'smith@ork.ai',
          area: 'kubernetes',
          target: 'beta',
          context: new Map([['serialNumber', '12345678X']]),
        }),
      ).rejects.toMatchObject({ internalServerErrorCode: InternalServerErrorCode.AnyInternalConnectionError })
    })

    it('Should throw XUNDError (UnknownError) for unexpected non-Axios errors from the Mosyle API', async () => {
      mockPost.mockRejectedValue(new Error('Unexpected error'))
      await expect(
        service.implEvaluateAccess()({
          username: 'smith@ork.ai',
          area: 'kubernetes',
          target: 'beta',
          context: new Map([['serialNumber', '12345678X']]),
        }),
      ).rejects.toMatchObject({ internalServerErrorCode: InternalServerErrorCode.UnknownError })
    })

    it('Should reuse the cached bearer token on subsequent calls without calling login again', async () => {
      const params = {
        username: 'smith@ork.ai',
        area: 'kubernetes',
        target: 'beta',
        context: new Map([['serialNumber', '12345678X']]),
      }
      await service.implEvaluateAccess()(params)
      await service.implEvaluateAccess()(params)
      const loginCalls = mockPost.mock.calls.filter(([url]) => (url as string).includes('login'))
      expect(loginCalls).toHaveLength(1)
    })
  })
})
