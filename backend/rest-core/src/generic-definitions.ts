import { Endpoint } from './endpoint'
import { FilterType } from './filter-type'

export type SearchType<T> = { [K in keyof T]?: string | number | boolean }

export type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T]

/**
 * Generic type to get the keys that can be selected in a REST API (field name of the primitive types like string, number or boolean)
 */
export type Select<T> = Array<keyof T> // { [K in FilteredKeys<T, string | number | boolean>]: T[K] }

export type SequelizeExpandObject<T> = {
  // Name of the Sequelize Model
  model: string

  // The association name, if defined
  as?: keyof T

  // Nested Include statement
  include?: any

  // Filter the relation
  where?: any

  // The relation is mandatory
  required?: boolean

  // Select only the following attributes from the relation
  attributes?: string[]
}

/**
 * Generic type to retrieve the keys that can be expanded (non-primitive types like an object or array)
 */
export type Expand<T> = Array<keyof T | SequelizeExpandObject<T>>

/**
 * Endpoint to retrieve a single entity
 */
export type GetEntityEndpoint<T> = Endpoint<{
  result: T
  urlParameters: { id: string }
  queryParameters: {
    select?: Select<T>
    expand?: Expand<T>
  }
}>

/**
 * Endpoint to retrieve an entity collection
 */
export type GetEntityCollectionEndpoint<T> = Endpoint<{
  result: { count: number; data: T[] }
  queryParameters: {
    select?: Select<T>
    expand?: Expand<T>
    orderBy?: keyof T
    orderDirection?: 'ASC' | 'DESC'
    top?: number
    skip?: number
    filter?: FilterType<T>
    search?: SearchType<T>
  }
}>

/**
 * Endpoint to retrieve an entity collection, query params switched to body
 */
export type PostGetEntityCollectionEndpoint<T> = Endpoint<{
  result: { count: number; data: T[] }
  body: {
    select?: Select<T>
    expand?: Expand<T>
    orderBy?: keyof T
    orderDirection?: 'ASC' | 'DESC'
    top?: number
    skip?: number
    filter?: FilterType<T>
    search?: SearchType<T>
  }
}>

/**
 * Endpoint for creating new entities via POST request
 */
export type PostEntityEndpoint<T> = Endpoint<{
  result: T
  body: T
  queryParameters: {
    select?: Select<T>
    expand?: Expand<T>
  }
}>

/**
 * Endpoint to incrementally update an existing entity
 */
export type PatchEntityEndpoint<T> = Endpoint<{
  body: Partial<T>
  result: T
  urlParameters: { id: string }
  queryParameters: {
    select?: Select<T>
    expand?: Expand<T>
  }
}>

/**
 * Endpoint to remove an entity from the database
 */
export type DeleteEntityEndpoint<T> = Endpoint<{
  result: unknown | T
  urlParameters: { id: string }
}>
