import { Server, Socket } from 'net'
import { readdirSync } from 'fs'
import os from 'os'
import express from 'express'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { SerializeLifecycle } from '../../../generic-utils'
import { createErrorHandler, createNotFoundHandler } from '../handlers'
import { LogLifecycle } from '../utils/add-lifecycle-logging'
import { createOrkApiRoutes } from '../routes/OrkApi'
import { useAuthentication } from '../middlewares/authentication'
import { AuthorizationController } from '../controllers'
import { ConfigurationError } from '../errors'
import { getLoggerForService } from './logger'
import { RolebindingSchedulerService } from './rolebindingSchedulerService'
import { Evaluator } from './evaluator'
import { AccessConfigService } from './accessConfigService'
import { rolebindingConfigExtractor } from './rolebindingConfig'
import { MosyleService, mosyleConfigExtractor } from './mosyleService'
import { Authorizer } from './authorizer'
import { chainConfigExtractor, resolveChains } from './chainConfig'
import { ConfigValues, KubernetesService, RolebindingConfigService, getLoggerWithScope } from '.'

/**
 * Service that's responsible for serving the public API endpoint
 */
@LogLifecycle()
@SerializeLifecycle()
export class ORKWeb {
  public readonly logger = getLoggerForService(this, this.options.config)
  public readonly requestLogger = getLoggerWithScope('ORKWebRequests', this.options.config)
  /**
   * Initializes the Web Service, starts the listener
   */
  public async init() {
    this.logger.debug({ message: 'Initializing Express middlewares' })
    this.expressApp.use(cookieParser())

    this.expressApp.use(
      helmet({
        frameguard: false,
      }),
    )
    this.expressApp.use(bodyParser.json({ limit: '10MB' }))
    this.expressApp.use(bodyParser.urlencoded({ extended: true }))
    this.logger.debug({ message: 'Initializing Express REST API routes' })

    this.expressApp.use((req, res, next) => {
      const oldWrite = res.write
      const oldEnd = res.end
      const chunks: Buffer[] = []
      res.write = function (chunk: Buffer, ...args: any[]) {
        chunks.push(Buffer.from(chunk))
        return oldWrite.apply(res, [chunk, ...args] as any)
      }

      const { requestLogger } = this

      res.end = function (...args: any[]) {
        try {
          const responseBody = JSON.parse(
            args[0] instanceof Buffer ? args[0].toString('utf-8') : Buffer.concat(chunks).toString('utf8') || '{}',
          )
          const { method, url, body, headers } = req
          requestLogger.debug({
            message: `${method} ${url}`,
            request: { method, url, body, headers },
            response: { body: responseBody, statusCode: res.statusCode },
          })
        } catch (error) {
          // Ignore
        }
        return oldEnd.apply(res, [...args] as any)
      }
      next()
    })

    this.expressApp.get('/status', (_req, res) => res.sendStatus(200))
    this.expressApp.use(useAuthentication())

    const rolebindingConfig = AccessConfigService.extract(rolebindingConfigExtractor)
    const mosyleConfig = AccessConfigService.extract(mosyleConfigExtractor)
    const rolebindingConfigService = this.rolebindingConfigService ?? new RolebindingConfigService(rolebindingConfig)
    const mosyleService =
      this.mosyleService ?? new MosyleService({ config: this.options.config, mosyleAccessConfig: mosyleConfig })

    const cluster_list = this.readClusterList()
    this.logger.info({ message: 'Found config for following cluster:' + cluster_list })
    const kubernetesService = new KubernetesService(
      { config: this.options.config },
      rolebindingConfigService,
      cluster_list,
    )

    this.rolebindingSchedulerService = new RolebindingSchedulerService(
      { config: this.options.config },
      kubernetesService,
    )
    await this.rolebindingSchedulerService.init()
    const authorizationController = new AuthorizationController({ config: this.options.config })
    const authorizers: Record<string, Authorizer> = {
      [KubernetesService.AREA_NAME]: kubernetesService,
    }
    const evaluators: Record<string, Evaluator> = {
      rolebinding: rolebindingConfigService,
      mosyle: mosyleService,
    }
    const chainDefinitions = AccessConfigService.extract(chainConfigExtractor)
    for (const { area, authorizer, evaluators: chainEvaluators } of resolveChains(
      chainDefinitions,
      authorizers,
      evaluators,
    )) {
      authorizationController.addChain(area, authorizer, chainEvaluators)
    }

    this.expressApp.use(this.options.config.route, createOrkApiRoutes({ kubernetesService, authorizationController }))

    this.expressApp.use(
      createErrorHandler({
        logger: this.logger,
        config: this.options.config,
      }),
    )
    this.expressApp.use(this.options.config.route, createNotFoundHandler(this.logger))

    await new Promise<void>((resolve, reject) => {
      this.server = this.expressApp
        .listen(this.options.config.port)
        .on('listening', () => {
          this.logger.info({ message: `Listening at port ${this.options.config.port}` })
          resolve()
        })
        .on('error', reject)
      this.server.on('connection', this.onConnection)
    })
  }
  public expressApp = express()
  public server!: Server
  private readonly openedSockets = new Set<Socket>()
  public rolebindingSchedulerService!: RolebindingSchedulerService

  /**
   * Shuts down the web service, closes the listener and the opened sockets
   */
  public async dispose() {
    if (this.rolebindingSchedulerService) {
      await this.rolebindingSchedulerService.dispose()
    }
    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      this.logger.debug({ message: 'Listener closed' })
      this.server.off('connection', this.onConnection)
      this.logger.debug({ message: 'Connection handler removed' })
    }

    this.openedSockets.forEach((s) => s.destroy())
    this.logger.debug({
      message: this.openedSockets.size ? `Closing ${this.openedSockets.size} opened sockets` : 'All sockets closed.',
    })
  }

  private readClusterList(): string[] {
    const kubeconfig_dir = `${os.homedir()}/.kube/`
    try {
      const files = readdirSync(kubeconfig_dir)

      return files
        .filter((file) => {
          // Match files starting with "config-"
          return /^config-/.test(file)
        })
        .map((file) => {
          // Extract the part after "config-"
          return file.replace(/^config-/, '')
        })
        .sort() // Sort alphabetically for consistent ordering
    } catch (error) {
      console.error(`Failed to read kubeconfig directory: ${kubeconfig_dir}`, error)
      throw new ConfigurationError(['.kube/config-'])
    }
  }

  private readonly onConnection = (socket: Socket) => {
    this.openedSockets.add(socket)
    socket.once('close', () => this.openedSockets.delete(socket))
  }

  /**
   * @param options The service configuration object
   * @param {ConfigValues} options.config The application config
   * @param {RolebindingConfigService} rolebindingConfigService a service to handle configuration for rolebindings
   * @param {MosyleService} mosyleService a service to handle device management verification
   */
  constructor(
    public readonly options: {
      config: ConfigValues
    },
    private readonly rolebindingConfigService?: RolebindingConfigService,
    private readonly mosyleService?: MosyleService,
  ) { }
}
