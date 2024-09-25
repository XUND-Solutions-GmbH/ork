import { Handler } from 'express'
import { Operation, Resource, User } from '../../../auth'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      assertIsAuthenticated: () => Promise<void>
      getCurrentUser: () => Promise<User>
      assertHasPermission: (operation: Operation, resource: Resource) => Promise<void>
    }
  }
}

/**
 * @returns The generated Express middleware
 */
export const useAuthentication = (): Handler => (request, _res, next) => {
  request.assertIsAuthenticated = async () => {
    throw new Error('Not implemented :(((')
  }
  request.getCurrentUser = async () => {
    throw new Error('Not implemented :(((')
  }
  request.assertHasPermission = async (_operation: Operation, _resource: Resource) => {
    throw new Error('Not implemented :(((')
  }

  next()
}
