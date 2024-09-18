import { Endpoint } from './endpoint'
import { Method } from './method'

export type RestApi = {
  [TMethod in Method]?: {
    [TUrl: string]: Endpoint<{ result: unknown }>
  }
}
