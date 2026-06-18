import rawConfig from '../accessConfig.json'

export type RawAccessConfig = typeof rawConfig

export class AccessConfigService {
    private static readonly raw: RawAccessConfig = rawConfig

    public static extract<T>(extractor: (raw: RawAccessConfig) => T): T {
        return extractor(this.raw)
    }
}