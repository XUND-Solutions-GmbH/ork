import { createMiddleware } from '../../../rest-server-express/dist'
import { ORKApi } from '../../../common/dist'
import { KubernetesService } from '../services'
import { createGetUserRolebindingsRoute } from './rolebindingConfig'
import { createAddRolebindingToClusterRoute } from './kubernetes'
import { AuthorizationController } from '../controllers/authorizationController'
import { createAuthorizeUserForTarget, createGetAccessInfoForUsers } from './chaining'

/**
 *
 * @param options The related options object
 * @param {KubernetesService} options.kubernetesService A service instance for KubeApi
 * @param options.authorizationController controller to call with API
 * @returns the created API Routes middleware
 */
export const createOrkApiRoutes = (options: { kubernetesService: KubernetesService, authorizationController: AuthorizationController }) =>
  createMiddleware<ORKApi>({
    GET: {
      '/:area/authorization': createGetAccessInfoForUsers(options.authorizationController),
      '/:area/:target/authorization': createGetAccessInfoForUsers(options.authorizationController),
      '/userrolebindings/': createGetUserRolebindingsRoute(),
    },
    POST: {
      '/:area/:target/authorization': createAuthorizeUserForTarget(options.authorizationController),
      '/clusters/:id/rolebindings/': createAddRolebindingToClusterRoute(options.kubernetesService),
    },
  })
