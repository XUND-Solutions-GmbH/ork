import { STATUS_CODES } from 'http'

/**
 * @param code The Error code (e.g. 404)
 * @returns The status text (e.g. Not found)
 */
export const createErrorFromCode = (code: number) => {
  return STATUS_CODES[code]
}
