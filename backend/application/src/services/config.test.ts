import { ConfigService, getDefaultConfigValues } from './config'

describe('ConfigService', () => {
  it('Should be constructed with default values', () => {
    const c = new ConfigService()
    expect(JSON.stringify(c)).toBe(JSON.stringify(getDefaultConfigValues()))
  })

  it('Should allow value overrides', () => {
    const c = new ConfigService({ port: 6969 })
    expect(c.port).toBe(6969)
  })

  it('Should throw for non-dev and non-test environments', () => {
    expect(() => new ConfigService({ environment: 'DEMO' })).toThrowError()
  })
})
