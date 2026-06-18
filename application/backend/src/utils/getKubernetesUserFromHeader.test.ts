import { Request } from 'express'
import { ORKError } from '../errors'

jest.mock('../services/accessConfigService', () => ({
  AccessConfigService: {
    extract: jest.fn().mockReturnValue({ userHeaderName: 'x-vouch-user' }),
  },
}))

import { getKubernetesUserFromHeader, getKubernetesUserFromHeaderValue } from './getKubernetesUserFromHeader'

const mockRequest = (headerValue: string | string[] | undefined): Request =>
  ({ headers: { 'x-vouch-user': headerValue } }) as unknown as Request

describe('getKubernetesUserFromHeader', () => {
  it('should return the email address from the request header', () => {
    const user = getKubernetesUserFromHeader(mockRequest('ork@xund.ai'))
    expect(user).toEqual('ork@xund.ai')
  })

  it('should throw an ORKError when the header is missing', () => {
    expect(() => getKubernetesUserFromHeader(mockRequest(undefined))).toThrow(ORKError)
  })

  it('should throw an ORKError when the header is an array', () => {
    expect(() => getKubernetesUserFromHeader(mockRequest(['ork@xund.ai']))).toThrow(ORKError)
  })
})

describe('getKubernetesUserFromHeaderValue', () => {
  it('should return the email address when given a valid email string', () => {
    expect(getKubernetesUserFromHeaderValue('ork@xund.ai')).toEqual('ork@xund.ai')
  })

  it('should throw an ORKError when given undefined', () => {
    expect(() => getKubernetesUserFromHeaderValue(undefined)).toThrow(ORKError)
  })

  it('should throw an ORKError when given an array', () => {
    expect(() => getKubernetesUserFromHeaderValue(['ork@xund.ai'])).toThrow(ORKError)
  })

  it('should throw an ORKError when given a comma-separated string', () => {
    expect(() => getKubernetesUserFromHeaderValue('ork@xund.ai,other@xund.ai')).toThrow(ORKError)
  })

  it('should throw an ORKError when the value is missing @', () => {
    expect(() => getKubernetesUserFromHeaderValue('orkxund.ai')).toThrow(ORKError)
  })

  it('should throw an ORKError when the value is missing .', () => {
    expect(() => getKubernetesUserFromHeaderValue('ork@xundai')).toThrow(ORKError)
  })
})
