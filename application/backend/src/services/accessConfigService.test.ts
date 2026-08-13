jest.mock('fs')

const validConfig = {
  userHeaderName: 'x-vouch-user',
  maxExpiryHours: 12,
  mosyleEnforcement: [],
  chains: [],
  rolebindings: [],
}

/**
 * The access config is loaded once, eagerly, when accessConfigService.ts is evaluated.
 * jest.isolateModules gives each test its own fresh module registry (including a fresh
 * 'fs' automock), so 'fs' and './accessConfigService' must be required together inside
 * the same callback for the mocked readFileSync to be the one accessConfigService sees.
 * @param mockImpl Fake implementation for the isolated fs.readFileSync mock
 * @returns The freshly (re-)loaded accessConfigService module
 */
function loadServiceWithMockedReadFileSync(mockImpl: (path: string) => string) {
  let loaded: typeof import('./accessConfigService')
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules requires synchronous require()
    const fs = require('fs')
    fs.readFileSync.mockImplementation(mockImpl)
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules requires synchronous require()
    loaded = require('./accessConfigService')
  })
  return loaded!
}

describe('AccessConfigService', () => {
  const originalEnv = process.env.ACCESS_CONFIG_PATH

  beforeEach(() => {
    process.env.ACCESS_CONFIG_PATH = '/fake/accessConfig.json'
  })

  afterAll(() => {
    process.env.ACCESS_CONFIG_PATH = originalEnv
  })

  it('Should load and expose the config when the file exists and is valid JSON', () => {
    const { AccessConfigService } = loadServiceWithMockedReadFileSync((path) =>
      path === '/fake/accessConfig.json' ? JSON.stringify(validConfig) : '',
    )

    expect(AccessConfigService.extract((raw) => raw.userHeaderName)).toBe('x-vouch-user')
  })

  it('Should throw an AccessConfigError when the file does not exist', () => {
    expect(() =>
      loadServiceWithMockedReadFileSync((path) => {
        if (path === '/fake/accessConfig.json') {
          throw Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })
        }
        return ''
      }),
    ).toThrow(/Unable to load access config.*ENOENT/)
  })

  it('Should throw an AccessConfigError when the file contains invalid JSON', () => {
    expect(() =>
      loadServiceWithMockedReadFileSync((path) =>
        path === '/fake/accessConfig.json' ? '{ this is not valid json' : '',
      ),
    ).toThrow(/Unable to load access config/)
  })
})
