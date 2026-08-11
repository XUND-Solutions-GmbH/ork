import { ConfigurationError } from '../errors'
import { Authorizer } from './authorizer'
import { Evaluator } from './evaluator'
import { RawAccessConfig } from './accessConfigService'

export type ChainDefinition = {
    area: string
    authorizer: string
    evaluators: string[]
}

export type ChainConfiguration = ChainDefinition[]

export const chainConfigExtractor = (raw: RawAccessConfig): ChainConfiguration => raw.chains

export type ResolvedChain = {
    area: string
    authorizer: Authorizer
    evaluators: Evaluator[]
}

/**
 * @param chainDefinitions parsed chain definitions from the access config
 * @throws {ConfigurationError} when the same area is defined by more than one chain definition
 */
const assertNoDuplicateAreas = (chainDefinitions: ChainConfiguration): void => {
    const areaCounts = new Map<string, number>()
    for (const { area } of chainDefinitions) {
        areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1)
    }
    const duplicateAreas = [...areaCounts.entries()].filter(([, count]) => count > 1).map(([area]) => area)
    if (duplicateAreas.length > 0) throw new ConfigurationError(duplicateAreas)
}

/**
 * @param chainDefinitions parsed chain definitions from the access config
 * @param authorizers registry of authorizer instances keyed by their config name
 * @param evaluators registry of evaluator instances keyed by their config name
 * @throws {ConfigurationError} when a chain definition references an unknown authorizer/evaluator key, or when the same area is defined more than once
 * @returns the chain definitions resolved to actual Authorizer/Evaluator instances
 */
export const resolveChains = (
    chainDefinitions: ChainConfiguration,
    authorizers: Record<string, Authorizer>,
    evaluators: Record<string, Evaluator>,
): ResolvedChain[] => {
    assertNoDuplicateAreas(chainDefinitions)
    return chainDefinitions.map((chainDefinition) => {
        const authorizer = authorizers[chainDefinition.authorizer]
        const chainEvaluators = chainDefinition.evaluators.map((name) => evaluators[name])
        const missingKeys = [
            ...(authorizer ? [] : [chainDefinition.authorizer]),
            ...chainDefinition.evaluators.filter((name) => !evaluators[name]),
        ]
        if (missingKeys.length > 0) throw new ConfigurationError(missingKeys)
        return { area: chainDefinition.area, authorizer, evaluators: chainEvaluators }
    })
}
