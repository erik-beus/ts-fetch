export interface IJsonStatus<T, E> {
  data?: T
  errorData?: E
  networkError?: NetworkError
  statusCode?: number
}

export type NetworkError = 'TIMEOUT' | 'OTHER'

export type HttpType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface IExtraHeader {
  key: string
  value: string
}

export interface IRequestBasicParams<B = any> {
  body?: B
  extraHeaders?: IExtraHeader[]
  method?: HttpType
  jsonRequest?: boolean
  jsonResponse?: boolean
  url: string
}

export interface IValidStatusCode {
  validStatusCodes?: number[]
  validStatusCodeStart?: number
  validStatusCodeEnd?: number
}

export type IRequestParams<B> = IRequestBasicParams<B> & IValidStatusCode

const bodyHttpTypes: HttpType[] = ['POST', 'PUT', 'PATCH', 'DELETE']

const defaultRequestParams = {
  method: 'GET',
  jsonRequest: true,
  jsonResponse: true,
  validStatusCodeStart: 200,
  validStatusCodeEnd: 299,
  timeout: 10000,
}

/**
 * Sends a standard request, and handles JSON parsing and response mapping to IJSonStatus
 * If the IJsonStatus data is defined, it means the request was successful.
 * If the networkError is set it means a network error happened.
 * If data is undefined, and networkError is unset, errorData will be defined
 * T is the expected type to be returned on success, E the expected type on errors
 * @param body Optional body for POST requests
 * @param extraHeaders Optional extra headers to add
 * @param method Http method to use (one of httpType)
 * @param jsonRequest Optional boolean whether this is a boolean request. Defaults to JSON - set this to false to omit json request headers
 * @param jsonResponse Optional boolean whether this is a boolean response. Defaults to JSON - set this to false to omit json response headers
 * @param validStatusCodes Optional array of HTTP status codes to consider success. Default is 200 - 299
 * @param url Full path for request - example: https://github.com/api/test
 * @return IJsonStatus object with the parsed data or error
 */
export function requestJson<T, E, B = Object>(
  requestParams: IRequestParams<B>,
): Promise<IJsonStatus<T, E>> {
  const processedParams = { ...defaultRequestParams, ...requestParams }
  const {
    url,
    method,
    body,
    extraHeaders,
    jsonResponse,
    jsonRequest,
    validStatusCodes,
    validStatusCodeStart,
    validStatusCodeEnd,
    timeout,
  } = processedParams
  const statusResponse: IJsonStatus<T, E> = {}
  const headers = new Headers()
  if (jsonRequest) {
    // Add default JSON headers
    headers.append('Content-Type', 'application/json')
  }
  if (jsonResponse) {
    headers.append('Accept', 'application/json')
    // Add default JSON headers
  }
  if (extraHeaders) {
    extraHeaders.map(h => headers.append(h.key, h.value))
  }
  const params: RequestInit = {
    method,
    headers,
  }
  if (body && bodyHttpTypes.includes(method as HttpType)) {
    params.body = JSON.stringify(body)
  }

  return Promise.race([
    fetch(url, params),
    // This promise will never resolve
    new Promise((_, reject) =>
      setTimeout(() => {
        statusResponse.statusCode = 408 // Timeout status code
        const err: NetworkError = 'TIMEOUT'
        reject(err)
      }, timeout),
    ),
  ])
    .then((res: {} | Response) => {
      // response will always be type 'Response'
      const response = res as Response
      statusResponse.statusCode = response.status

      if (jsonResponse) {
        return response.json()
      } else {
        return response
      }
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
    .catch((err: NetworkError | Error) => {
      // The error is either a timeout ('TIMEOUT'), a network error or a JSON parsing error
      // For now we're only handling the timeout, and calling all others 'OTHER'
      statusResponse.networkError = err === 'TIMEOUT' ? 'TIMEOUT' : 'OTHER'
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
