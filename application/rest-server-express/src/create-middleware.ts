/* eslint-disable require-jsdoc */
import { Request, Response, Router } from 'express'
import { Endpoint, Method, RestApi } from '../../rest-core'

export type RestApiImplementation<T extends RestApi> = {
  [TMethod in keyof T]: {
    [TUrl in keyof T[TMethod]]: T[TMethod][TUrl] extends Endpoint<any>
      ? EndpointImplementation<T[TMethod][TUrl]>
      : never
  }
}

type Paths<T> = { [TMethod in keyof T]: keyof T[TMethod] }[keyof T]

export type RestApiExpressMiddlewares<T extends RestApi> = Array<{
  middleware: (req: Request, res: Response, next: () => void) => void
  exclude: Array<Paths<T>>
}>

export type EndpointImplementation<T extends Endpoint<any>> = (
  options: { request: Request; response: Response } & (T extends Endpoint<{ result: unknown; body: infer U }>
    ? { body: U }
    : unknown) &
    (T extends Endpoint<{ result: unknown; urlParameters: infer U }> ? { urlParameters: U } : unknown) &
    (T extends Endpoint<{ result: unknown; queryParameters: infer U }> ? { queryParameters: U } : unknown) &
    (T extends Endpoint<{ result: unknown; headers: infer U }> ? { headers: U } : unknown),
) => Promise<{
  /**
   * The HTTP return code
   */
  code: number
  /**
   * The response body
   */
  data: T['result']
  /**
   * Response won't be sent by the REST API Framework (e.g. binaries, steams...)
   */
  bypass?: boolean
  /**
   * If this property is set, a redirect response will be sent
   */
  redirect?: string
}>

export const useMethodFromRouter = (method: Method, router: Router) => {
  switch (method) {
    case 'GET':
      return router.get
    case 'POST':
      return router.post
    case 'PATCH':
      return router.patch
    case 'PUT':
      return router.put
    case 'DELETE':
      return router.delete
    default:
      throw Error(`HTTP Method '${method}' not supported!`)
  }
}

export const tryDecodeQueryParam = (queryParam: any) => {
  try {
    return JSON.parse(decodeURIComponent((queryParam as any).toString()))
  } catch {
    try {
      return JSON.parse(queryParam.toString())
    } catch (error) {
      return queryParam
    }
  }
}

export const createMiddleware = <T extends RestApi>(
  options: RestApiImplementation<T>,
  middlewares?: RestApiExpressMiddlewares<T>,
) => {
  const router = Router()

  Object.keys(options).forEach((m) => {
    const method = m as keyof typeof options
    Object.keys(options[method]).forEach((u) => {
      const url = u as keyof (typeof options)[typeof method]
      const endpoint = options[method][url]
      const middlewaresForRoute =
        middlewares
          ?.filter((middleware) => !middleware.exclude.includes(url as Paths<T>))
          .map(({ middleware }) => middleware) ?? []

      useMethodFromRouter(method as Method, router).bind(router)(
        url.toString(),
        ...middlewaresForRoute,
        async (req, resp, next) => {
          try {
            const decodedQuery = Object.fromEntries(
              Object.entries(req.query).map(([key, value]) => {
                return [key, tryDecodeQueryParam(value)]
              }),
            )
            const result = await endpoint({
              body: req.body,
              urlParameters: req.params,
              queryParameters: decodedQuery,
              request: req,
              response: resp,
              headers: req.headers,
            } as any)

            if (result.redirect) {
              return resp.redirect(result.code, result.redirect)
            }

            if (!result.bypass) {
              // `resp.json()` automatically sets the `Content-Type=application/json` header, even on an empty body
              // so in this case we need to use the `resp.send()` function
              if (typeof result.data === 'undefined') {
                return resp.status(result.code).send(result.data)
              } else {
                return resp.status(result.code).json(result.data)
              }
            }

            return undefined
          } catch (error) {
            next(error)
            return undefined
          }
        },
      )
    })
  })

  return router
}
