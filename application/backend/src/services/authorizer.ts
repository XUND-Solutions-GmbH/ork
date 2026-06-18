import { AuthorizationResult } from '../../../common'

export interface Authorizer {
  implAuthorize: () => (params: {
    username: string
    target?: string | undefined
    permission?: string | undefined
    expiry?: number | undefined
  }) => Promise<AuthorizationResult | undefined>
}
