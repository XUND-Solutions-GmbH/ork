/**
 * Resources not found anywhere in the system. These should not be used!
 * Kept here only for providing example of authorization model
 */
export const ORKResources = ['example'] as const

export const resources = [...ORKResources] as const

export type Resource = (typeof resources)[number]
