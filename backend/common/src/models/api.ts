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

export interface ORKApi extends RestApi {
  GET: {
    '/userrolebindings/': GetUserRolebindingsEndpoint
  }
  POST: {
    '/clusters/:id/rolebindings/': AddRolebindingToClusterEndpoint
  }
}
