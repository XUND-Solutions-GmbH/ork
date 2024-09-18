import { Handler } from 'express'
import { Logger } from '../../../logger'
import { httpErrorCodeFor } from '../errors'

/**
 * @param logger A Logger instance
 * @returns The created Not Found middleware
 */
export const createNotFoundHandler = (logger: Logger) =>
  ((req, res) => {
    logger.debug({ message: `URL not found: ${req.url}` })
    const statusCode = httpErrorCodeFor('NOT_FOUND')
    return res.status(statusCode).send({ error: 'Page not found' })
  }) as Handler
