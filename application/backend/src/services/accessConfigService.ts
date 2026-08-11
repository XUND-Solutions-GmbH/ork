import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'
import { AccessConfigError } from './../errors'

export interface RawAccessConfig {
  userHeaderName: string
  maxExpiryHours: number
  mosyleEnforcement: Array<{ area: string; targets?: string[] }>
  chains: Array<{
    area: string
    authorizer: string
    evaluators: string[]
  }>
  rolebindings: Array<{
    user: string
    permissions: Array<{
      clusters: string[]
      roleDefinitions: {
        roles: string[]
        clusterRoles: string[]
      }
    }>
  }>
}

// Resolves relative to the compiled module's own location (backend/dist/services or,
// under ts-jest, backend/src/services) rather than process.cwd(), since cwd differs
// between how the Dockerfile entrypoint and the backend workspace's own scripts launch the app.
const defaultConfigPath = join(__dirname, '..', '..', 'accessConfig.json')

/**
 * @returns The resolved path to read the access config from
 */
function resolveConfigPath(): string {
  dotenv.config()
  return process.env.ACCESS_CONFIG_PATH || defaultConfigPath
}

/**
 * @returns The parsed access config read from the filesystem
 * @throws {AccessConfigError} When the file is missing or isn't valid JSON
 */
function loadRawConfig(): RawAccessConfig {
  const configPath = resolveConfigPath()
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as RawAccessConfig
  } catch (error) {
    throw new AccessConfigError(configPath, error)
  }
}

export class AccessConfigService {
  private static readonly raw: RawAccessConfig = loadRawConfig()

  public static extract<T>(extractor: (raw: RawAccessConfig) => T): T {
    return extractor(this.raw)
  }
}
