/* eslint-disable require-jsdoc */
export class EnvironmentValidator<T extends object> {
  /**
   * @returns a list about the missing keys
   */
  public getMissingKeys() {
    const envKeys = Object.keys(this.environment) as Array<keyof T>
    return this.requiredKeys.filter((requiredKey) => !envKeys.includes(requiredKey))
  }

  /**
   * @returns a boolean that indicates if the environment is valid
   */
  public isValid() {
    return this.getMissingKeys().length === 0
  }

  /**
   * Pushes an additional key to the validator
   * @param key A key name
   */
  public addDemand(key: keyof T) {
    this.requiredKeys.push(key)
  }

  constructor(private readonly environment: T, private readonly requiredKeys: Array<keyof T>) {}
}
