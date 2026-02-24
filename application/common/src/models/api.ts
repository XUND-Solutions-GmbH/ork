import { Endpoint, GetEntityEndpoint, RestApi } from '../../../rest-core'

export type User = {
  username: string
  expiryHours?: number
}

export type Expiry = {
  expiryHours?: number
}

export type PermissionsForUserResponse = {
  cluster: string
  roles?: string[]
  clusterRoles?: string[]
}

export type TargetPermissionsForUserResponse = {
  area: string
  target?: string[]
  permissions?: string[]
}

export type AuthorizationResult = {
  expiryHours: number
  message: string
}

export type AuthorizationRequest = {
  permission?: string
  context?: string
}

type PostEntityEndpoint<T, B> = Endpoint<{
  result: T
  urlParameters: { area: string; target: string }
  body: B
}>

type PostEntityEndpointOnEntity<T, B> = Endpoint<{
  result: T
  urlParameters: { id: string }
  body: B
}>

export type GetUserRolebindingsEndpoint = GetEntityEndpoint<{ result: { rolebindings: PermissionsForUserResponse[] } }>
export type AddRolebindingToClusterEndpoint = PostEntityEndpointOnEntity<
  { result: { status: string; data?: string } },
  Expiry
>
export type GetAccessInfoForUserEndpoint = Endpoint<{
  urlParameters: { area: string; target?: string }
  result: { status: string; permissions?: TargetPermissionsForUserResponse }
}>
export type AuthorizeUserForTargetEndpoint = PostEntityEndpoint<
  { result: { status: string; data?: string } },
  AuthorizationRequest
>

export interface ORKApi extends RestApi {
  GET: {
    '/:area/authorization': GetAccessInfoForUserEndpoint
    '/:area/:target/authorization': GetAccessInfoForUserEndpoint
    '/userrolebindings/': GetUserRolebindingsEndpoint
  }
  POST: {
    '/:area/:target/authorization': AuthorizeUserForTargetEndpoint
    '/clusters/:id/rolebindings/': AddRolebindingToClusterEndpoint
  }
}
