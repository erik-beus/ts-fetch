export interface IJsonStatus<T, E> {
  data?: T
  errorData?: E
  networkError: boolean
  statusCode?: number
}

export type httpType = 'GET' | 'POST' | 'PUT' | 'PATCH'

export interface IExtraHeader {
  key: string
  value: string
}

export interface IRequestBasicParams {
  body?: object
  extraHeaders?: IExtraHeader[]
  method?: httpType
  jsonRequest?: boolean
  url: string
}

export interface IValidStatusCode {
  validStatusCodes?: number[]
  validStatusCodeStart?: number
  validStatusCodeEnd?: number
}

export type IRequestParams = IRequestBasicParams & IValidStatusCode

const defaultRequestParams = {
  method: 'GET',
  jsonRequest: true,
  validStatusCodeStart: 200,
  validStatusCodeEnd: 299,
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
 * @param nonJsonRequest Optional boolean whether this is not a boolean request. Defaults to JSON - set this to true to omit json headers
 * @param validStatusCodes Optional array of HTTP status codes to consider success. Default is 200 - 299
 * @return IJsonStatus object with the parsed data or error
 */
export function requestJson<T, E>(
  requestParams: IRequestParams,
): Promise<IJsonStatus<T, E>> {
  const processedParams = { ...defaultRequestParams, ...requestParams }
  const {
    url,
    method,
    body,
    extraHeaders,
    jsonRequest,
    validStatusCodes,
    validStatusCodeStart,
    validStatusCodeEnd,
  } = processedParams
  const statusResponse: IJsonStatus<T, E> = { networkError: false }
  const headers = new Headers()
  if (jsonRequest) {
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
      const validStatusCode = isValidStatusCode(statusResponse.statusCode!, {
        validStatusCodes,
        validStatusCodeStart,
        validStatusCodeEnd,
      })
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

const isValidStatusCode = (
  statusCode: number,
  validation: IValidStatusCode,
) => {
  const {
    validStatusCodes,
    validStatusCodeStart,
    validStatusCodeEnd,
  } = validation
  if (validStatusCodes) {
    return validStatusCodes.find(sc => sc === statusCode) !== undefined
  }
  if (validStatusCodeStart && validStatusCodeEnd) {
    return (
      statusCode >= validStatusCodeStart && statusCode <= validStatusCodeEnd
    )
  }
  return false
}
