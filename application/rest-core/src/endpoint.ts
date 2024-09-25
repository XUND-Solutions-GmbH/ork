export type EndpointOptions = {
  result: unknown
  urlParameters?: unknown
  queryParameters?: unknown
  errorResult?: unknown
  body?: unknown
  headers?: unknown
}

export type Endpoint<TOptions extends EndpointOptions> = {
  /**
   * The type of the response when the request succeeds
   */
  result: TOptions['result']
} & (TOptions extends { urlParameters: unknown }
  ? {
      /**
       * Parameters in the URL, e.g.: /api/my-entities/:entityId
       */
      urlParameters: TOptions['urlParameters']
    }
  : unknown) &
  (TOptions extends { queryParameters: unknown }
    ? {
        /**
         * Parameters in the Query String, e.g.: /api/my-entities?top=10
         */
        queryParameters: TOptions['queryParameters']
      }
    : unknown) &
  (TOptions extends { body: unknown }
    ? {
        /**
         * The Request Body
         */
        body: TOptions['body']
      }
    : unknown) &
  (TOptions extends { headers: unknown } ? { headers: TOptions['headers'] } : unknown)
