export const operations = ['read', 'write', 'admin'] as const
export type Operation = (typeof operations)[number]
