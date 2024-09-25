export type NumberComparisonOperators = '$gt' | '$gte' | '$lt' | '$lte'

export type RangeComparisonOperators = '$between' | '$notBetween'

export type StringComparisonOperators =
  | '$like'
  | '$notLike'
  | '$iLike'
  | '$notILike'
  | '$regexp'
  | '$notRegexp'
  | '$contains'
  | '$startsWith'
  | '$endsWith'

export type SingleComparisonOperators = '$eq' | '$ne' | '$is'

export type ArrayComparisonOperators = '$in' | '$notIn' | '$any'

export type LogicalOperators = '$and' | '$not' | '$or'

export type allOperators =
  | SingleComparisonOperators
  | NumberComparisonOperators
  | RangeComparisonOperators
  | StringComparisonOperators
  | ArrayComparisonOperators
  | LogicalOperators

export type FilterTypePerFields<T> = {
  [K in keyof T]?: T[K] extends object
    ? ObjectFilterType
    : T[K] extends number | undefined
    ? NumberFilterType
    : T[K] extends string | undefined
    ? StringFilterType
    : T[K] extends Date | undefined
    ? DateFilterType
    : T[K] extends Boolean | undefined
    ? BooleanFilterType
    : never
}

export type FilterType<T> = FilterTypePerFields<T> | FallbackFilterType<T>

export type ObjectFilterType = { [OP in allOperators]?: any }
export type NumberFilterType = { [SCO in NumberComparisonOperators]?: number } & {
  [RCO in RangeComparisonOperators]?: [number, number]
} & { [SCO in SingleComparisonOperators]?: number } & { [ACO in ArrayComparisonOperators]?: number[] }
export type StringFilterType = { [SCO in StringComparisonOperators]?: string } & {
  [SCO in SingleComparisonOperators]?: string
} & { [ACO in ArrayComparisonOperators]?: string[] }
export type DateFilterType = { [RCO in RangeComparisonOperators]?: [string, string] } & {
  [SCO in SingleComparisonOperators]?: string
}
export type BooleanFilterType = { [SCO in SingleComparisonOperators]?: boolean }
export type FallbackFilterType<T> = {
  [K in keyof T]?: {
    [SCO in SingleComparisonOperators]?: T[K]
  }
} & {
  [K in keyof T]?: {
    [ACO in ArrayComparisonOperators]?: Array<T[K]>
  }
} & { [LO in LogicalOperators]?: Array<FilterType<T>> }
