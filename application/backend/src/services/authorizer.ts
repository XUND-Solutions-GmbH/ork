import { AuthorizationResult } from '../../../common'

export interface Authorizer {
  implAuthorize: () => (params: {
    username: string
    area?: string
    target?: string | undefined
    permission?: string | undefined
    expiry?: number | undefined
  }) => Promise<AuthorizationResult | undefined>
}
