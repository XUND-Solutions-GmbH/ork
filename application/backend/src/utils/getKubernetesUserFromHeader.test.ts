import { ORKError } from '../errors'
import getKubernetesUserFromHeader from './getKubernetesUserFromHeader'

describe('getKubernetesUserFromHeader', () => {
  it('Should return the email address', () => {
    const user = getKubernetesUserFromHeader('ork@xund.ai')
    expect(user).toEqual('ork@xund.ai')
  })

  it('Should throw error when no user given', () => {
    try {
      getKubernetesUserFromHeader()
      throw new Error('No error thrown')
    } catch (err) {
      expect(err instanceof ORKError).toBeTruthy()
    }
  })

  it('Should throw an error when a sting[] is given', () => {
    try {
      getKubernetesUserFromHeader(['ork'])
      throw new Error('No error thrown')
    } catch (err) {
      expect(err instanceof ORKError).toBeTruthy()
    }
  })
})
