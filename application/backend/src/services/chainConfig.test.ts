import { ConfigurationError } from '../errors'
import { Authorizer } from './authorizer'
import { Evaluator } from './evaluator'
import { RawAccessConfig } from './accessConfigService'
import { chainConfigExtractor, resolveChains } from './chainConfig'

describe('chainConfigExtractor', () => {
  it('Should extract the chains array from the raw access config', () => {
    const raw = {
      chains: [{ area: 'kubernetes', authorizer: 'kubernetes', evaluators: ['rolebinding', 'mosyle'] }],
    } as unknown as RawAccessConfig
    expect(chainConfigExtractor(raw)).toBe(raw.chains)
  })
})

describe('resolveChains', () => {
  let mockAuthorizer: { implAuthorize: jest.Mock }
  let mockEvaluator1: { implEvaluateAccess: jest.Mock; implGetAccessesInfo: jest.Mock }
  let mockEvaluator2: { implEvaluateAccess: jest.Mock; implGetAccessesInfo: jest.Mock }

  beforeEach(() => {
    mockAuthorizer = { implAuthorize: jest.fn() }
    mockEvaluator1 = { implEvaluateAccess: jest.fn(), implGetAccessesInfo: jest.fn() }
    mockEvaluator2 = { implEvaluateAccess: jest.fn(), implGetAccessesInfo: jest.fn() }
  })

  it('Should resolve a single chain definition to the matching authorizer and evaluators', () => {
    const authorizers: Record<string, Authorizer> = { kubernetes: mockAuthorizer as any }
    const evaluators: Record<string, Evaluator> = {
      rolebinding: mockEvaluator1 as any,
      mosyle: mockEvaluator2 as any,
    }
    const result = resolveChains(
      [{ area: 'kubernetes', authorizer: 'kubernetes', evaluators: ['rolebinding', 'mosyle'] }],
      authorizers,
      evaluators,
    )
    expect(result).toEqual([
      { area: 'kubernetes', authorizer: mockAuthorizer, evaluators: [mockEvaluator1, mockEvaluator2] },
    ])
  })

  it('Should resolve multiple chain definitions independently', () => {
    const authorizers: Record<string, Authorizer> = { kubernetes: mockAuthorizer as any, other: mockAuthorizer as any }
    const evaluators: Record<string, Evaluator> = {
      rolebinding: mockEvaluator1 as any,
      mosyle: mockEvaluator2 as any,
    }
    const result = resolveChains(
      [
        { area: 'kubernetes', authorizer: 'kubernetes', evaluators: ['rolebinding'] },
        { area: 'other', authorizer: 'other', evaluators: ['mosyle'] },
      ],
      authorizers,
      evaluators,
    )
    expect(result).toEqual([
      { area: 'kubernetes', authorizer: mockAuthorizer, evaluators: [mockEvaluator1] },
      { area: 'other', authorizer: mockAuthorizer, evaluators: [mockEvaluator2] },
    ])
  })

  it('Should resolve a chain definition with no evaluators to an empty evaluators array', () => {
    const authorizers: Record<string, Authorizer> = { kubernetes: mockAuthorizer as any }
    const result = resolveChains([{ area: 'kubernetes', authorizer: 'kubernetes', evaluators: [] }], authorizers, {})
    expect(result).toEqual([{ area: 'kubernetes', authorizer: mockAuthorizer, evaluators: [] }])
  })

  it('Should throw ConfigurationError when the authorizer key is unknown', () => {
    const evaluators: Record<string, Evaluator> = { rolebinding: mockEvaluator1 as any }
    expect(() =>
      resolveChains([{ area: 'kubernetes', authorizer: 'unknown', evaluators: ['rolebinding'] }], {}, evaluators),
    ).toThrow(ConfigurationError)
  })

  it('Should throw ConfigurationError listing unknown evaluator keys', () => {
    const authorizers: Record<string, Authorizer> = { kubernetes: mockAuthorizer as any }
    expect(() =>
      resolveChains(
        [{ area: 'kubernetes', authorizer: 'kubernetes', evaluators: ['rolebinding', 'unknown-evaluator'] }],
        authorizers,
        { rolebinding: mockEvaluator1 as any },
      ),
    ).toThrow(ConfigurationError)

    try {
      resolveChains(
        [{ area: 'kubernetes', authorizer: 'kubernetes', evaluators: ['rolebinding', 'unknown-evaluator'] }],
        authorizers,
        { rolebinding: mockEvaluator1 as any },
      )
      fail('Expected resolveChains to throw')
    } catch (error) {
      expect((error as ConfigurationError).details?.description).toContain('unknown-evaluator')
      expect((error as ConfigurationError).details?.description).not.toContain('rolebinding')
    }
  })

  it('Should throw a single ConfigurationError listing both an unknown authorizer and unknown evaluators', () => {
    try {
      resolveChains(
        [{ area: 'kubernetes', authorizer: 'unknown-authorizer', evaluators: ['unknown-evaluator'] }],
        {},
        {},
      )
      fail('Expected resolveChains to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError)
      expect((error as ConfigurationError).details?.description).toContain('unknown-authorizer')
      expect((error as ConfigurationError).details?.description).toContain('unknown-evaluator')
    }
  })

  it('Should throw without returning any resolved chains when a later definition fails to resolve', () => {
    const authorizers: Record<string, Authorizer> = { kubernetes: mockAuthorizer as any }
    expect(() =>
      resolveChains(
        [
          { area: 'kubernetes', authorizer: 'kubernetes', evaluators: [] },
          { area: 'broken', authorizer: 'missing', evaluators: [] },
        ],
        authorizers,
        {},
      ),
    ).toThrow(ConfigurationError)
  })

  it('Should throw ConfigurationError when two chain definitions declare the same area', () => {
    const authorizers: Record<string, Authorizer> = { kubernetes: mockAuthorizer as any, other: mockAuthorizer as any }
    const evaluators: Record<string, Evaluator> = { rolebinding: mockEvaluator1 as any, mosyle: mockEvaluator2 as any }
    try {
      resolveChains(
        [
          { area: 'kubernetes', authorizer: 'kubernetes', evaluators: ['rolebinding'] },
          { area: 'kubernetes', authorizer: 'other', evaluators: ['mosyle'] },
        ],
        authorizers,
        evaluators,
      )
      fail('Expected resolveChains to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError)
      expect((error as ConfigurationError).details?.description).toContain('kubernetes')
    }
  })

  it('Should not throw when chain definitions declare distinct areas', () => {
    const authorizers: Record<string, Authorizer> = { kubernetes: mockAuthorizer as any, other: mockAuthorizer as any }
    expect(() =>
      resolveChains(
        [
          { area: 'kubernetes', authorizer: 'kubernetes', evaluators: [] },
          { area: 'other', authorizer: 'other', evaluators: [] },
        ],
        authorizers,
        {},
      ),
    ).not.toThrow()
  })
})
