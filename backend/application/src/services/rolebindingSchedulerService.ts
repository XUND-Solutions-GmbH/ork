import { Job } from 'node-schedule'
import { Logger } from '../../../logger'
import { ConfigValues } from '../services/config'
import { getLoggerForService } from './logger'
import { KubernetesService } from '.'

export class RolebindingSchedulerService {
  public readonly logger: Logger
  private readonly kubernetesService: KubernetesService

  /**
   * Trigger rolebinding deletion in this time interval
   */
  private static readonly checkRolebindingScheduleExpression = '0,30 * * * *'

  /**
   * The node-scheduler Job instance
   */
  private job!: Job

  /**
   * @param options The service configuration object
   * @param {ConfigValues} options.config The application config
   * @param {KubernetesService} kubernetesService The KubeAPI to regularly call for rolebinding deletion
   */
  constructor(options: { config: ConfigValues }, kubernetesService: KubernetesService) {
    this.kubernetesService = kubernetesService
    this.logger = getLoggerForService(this, options.config)
  }

  /**
   * Starts the scheduled clean up job
   */
  public async init() {
    this.job = new Job(async () => {
      try {
        const cleanExpiredRolebinding = this.kubernetesService.implCleanExpiredRolebinding()
        const deleted = await cleanExpiredRolebinding()
        if (deleted != 0) {
          this.logger.info({
            message: `Deleted ${deleted} rolebindings after expiration`,
          })
        }
      } catch (err) {
        if (err instanceof Error) {
          this.logger.error({ message: `Error during scheduled job: ${err.message}`, error: err })
        }
      }
    })
    this.job.reschedule(RolebindingSchedulerService.checkRolebindingScheduleExpression)
  }

  /**
   * Cancels the scheduled job in `this.init()`, also used by class decorators
   */
  public async dispose() {
    this.logger.debug({ message: `Shutting down ${RolebindingSchedulerService.name}` })
    if (this.job) {
      this.job.cancel()
    }
  }
}
