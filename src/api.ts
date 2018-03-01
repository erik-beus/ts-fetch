export interface IJsonStatus<T = any, E = any> {
  data?: T
  errorData?: E
  statusCode?: number
  networkError: boolean
}

export type httpType = 'GET' | 'POST' | 'PUT' | 'PATCH'

export interface IExtraHeader {
  key: string
  value: string
}

/**
 * Sends a standard request, and handles JSON parsing and response mapping to IJSonStatus
 * If the IJsonStatus data is defined, it means the request was successful.
 * If the networkError is true it means a network error happened.
 * If data is undefined, and networkError is false, errorData will be defined
 * T is the expected type to be returned on success, E the expected type on errors
 * @param url Full path for request - example: https://github.com/api/test
 * @param method Http method to use (one of httpType)
 * @param body Optional body for POST requests
 * @param extraHeaders Optional extra headers to add
 * @param validStatusCodes Optional array of HTTP status codes to consider success. Default is 200 - 299
 * @return IJsonStatus object with the parsed data or error
 */
export function requestJson<T, E>(
  url: string,
  method: httpType = 'GET',
  body?: object,
  extraHeaders?: IExtraHeader[],
  nonJsonRequest?: boolean,
  validStatusCodes?: number[],
): Promise<IJsonStatus<T, E>> {
  const statusResponse: IJsonStatus<T, E> = { networkError: false }
  const headers = new Headers()
  if (!nonJsonRequest) {
    // Add default JSON headers
    headers.append('Accept', 'application/json')
    headers.append('Content-Type', 'application/json')
  }
  if (extraHeaders) {
    extraHeaders.map(h => headers.append(h.key, h.value))
  }
  const params: RequestInit = {
    method,
    headers,
  }
  if (body && (method === 'POST' || method === 'PATCH')) {
    params.body = JSON.stringify(body)
  }
  return fetch(url, params)
    .then((response: Response) => {
      statusResponse.statusCode = response.status
      return response.json()
    })
    .then((json: T | E) => {
      // Allow expecting something other than 200s
      const validStatusCode = validStatusCodes
        ? statusResponse.statusCode && validStatusCodes.find(sc => sc === statusResponse.statusCode) !== undefined
        : // Default is all 2xx status codes
          statusResponse.statusCode && statusResponse.statusCode >= 200 && statusResponse.statusCode < 300
      if (validStatusCode) {
        // Success - type is T
        statusResponse.data = json as T
      } else {
        // Error - type is ApiError
        statusResponse.errorData = json as E
      }
      return statusResponse
    })
    .catch(() => {
      // For now we assume all errors are network errors. They could potentially be JSON parsing errors as well
      statusResponse.networkError = true
      return statusResponse
    })
}
