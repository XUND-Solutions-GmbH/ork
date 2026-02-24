export interface Evaluator {
    /* eslint-disable jsdoc/no-undefined-types */
    /**
     * Determines whether access shall be allowed for target, or if target is not applicable for area in general
     * @throws {MissingTargetError} a custom error to throw when area expects target to be provided
     * @returns a positive number for maximum allowed access, 0 if not authorized, undefined if no information available
     */
    implEvaluateAccess: () => (params: {
        username: string
        target?: string
        permission?: string
        context?: Map<string, string>
    }) => Promise<EvaluationResult>

    /**
     * Returns the permissions that can be requested for given target, or any target in given area
     * @throws {MissingTargetError} a custom error to throw when area expects target to be provided
     * @returns {AuthorizationInfo} undefined if all permissions allowed, empty arrays if no permissions allowed
     */
    implGetAccessesInfo: () => (params: {
        username: string
        target?: string
        context?: Map<string, string>
    }) => Promise<AuthorizationInfo>
}

export type EvaluationResult = {
    expiryHours: number | undefined
}

export type AuthorizationInfo = {
    allowedPermissionsPerTarget: Array<{ target: string; permissions: string[] | undefined }> | undefined
}