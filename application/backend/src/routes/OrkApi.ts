import { createMiddleware } from '../../../rest-server-express/dist'
import { ORKApi } from '../../../common/dist'
import { KubernetesService } from '../services'
import { createGetUserRolebindingsRoute } from './rolebindingConfig'
import { createAddRolebindingToClusterRoute } from './kubernetes'

/**
 *
 * @param options The related options object
 * @param {KubernetesService} options.kubernetesService A service instance for KubeApi
 * @returns the created API Routes middleware
 */
export const createOrkApiRoutes = (options: { kubernetesService: KubernetesService }) =>
  createMiddleware<ORKApi>({
    GET: {
      '/userrolebindings/': createGetUserRolebindingsRoute(),
    },
    POST: {
      '/clusters/:id/rolebindings/': createAddRolebindingToClusterRoute(options.kubernetesService),
    },
  })
