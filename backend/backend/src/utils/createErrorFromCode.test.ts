import { createErrorFromCode } from './createErrorFromCode'

describe('createErrorFromCode', () => {
  it('Should return the corresponding error from the code', () => {
    const statusText = createErrorFromCode(404)
    expect(statusText).toBe('Not Found')
  })
})
