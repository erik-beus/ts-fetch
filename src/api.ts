interface IBaseResponse {
  statusCode?: number;
}

interface ISuccessResponse<T> extends IBaseResponse {
  data: T;
  headers?: Record<string, string>;
  status: "OK";
}

interface IErrorResponse<E> extends IBaseResponse {
  errorData: E;
  status: "ERROR";
}

interface INetworkErrorResponse extends IBaseResponse {
  networkError: NetworkError;
  status: "NETWORK_ERROR";
}

export type TResponse<T, E> =
  | ISuccessResponse<T>
  | IErrorResponse<E>
  | INetworkErrorResponse;

export type NetworkError = "TIMEOUT" | "JSON_PARSING" | "OTHER";

export type HttpType =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface IExtraHeader {
  key: string;
  value: string;
}

export interface IRequestBasicParams<Body> {
  body?: Body;
  extraHeaders?: IExtraHeader[];
  method?: HttpType;
  jsonRequest?: boolean;
  jsonResponse?: boolean;
  timeout?: number; // timeout in milliseconds
  url: string;
}

export interface IValidStatusCode {
  validStatusCodes?: number[];
  validStatusCodeStart?: number;
  validStatusCodeEnd?: number;
}

export type IRequestParams<B> = IRequestBasicParams<B> & IValidStatusCode;

// The http types that allow a http body
const bodyHttpTypes: HttpType[] = [
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const defaultRequestParams = {
  method: "GET" as HttpType,
  jsonRequest: true,
  jsonResponse: true,
  validStatusCodeStart: 200,
  validStatusCodeEnd: 299,
  timeout: 12000, // 12 seconds default timeout
};

/**
 * Sends a standard request, and handles JSON parsing and response mapping to TResponse
 * If the TResponse success is true, it means the request was successful.
 * If the networkError is set it means a network error happened.
 * T is the expected type to be returned on success, Error the expected type on errors
 * Body is the type for the body arguments given
 * @param body Optional body for POST requests
 * @param extraHeaders Optional extra headers to add
 * @param method Http method to use (one of httpType)
 * @param jsonRequest Optional boolean whether this is a boolean request. Defaults to JSON - set this to false to omit json request headers
 * @param jsonResponse Optional boolean whether this is a boolean response. Defaults to JSON - set this to false to omit json response headers
 * @param validStatusCodes Optional array of HTTP status codes to consider success. Default is 200 - 299
 * @param url Full path for request - example: https://github.com/api/test
 * @return IJsonStatus object with the parsed data or error
 */
export function request<Return, Error, Body>(
  requestParams: IRequestParams<Body>,
): Promise<TResponse<Return, Error>> {
  const processedParams = { ...defaultRequestParams, ...requestParams };
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
  } = processedParams;
  let statusCode: number;
  const headers: Record<string, string> = {};
  if (jsonRequest) {
    // Add default JSON headers
    headers["Content-Type"] = "application/json";
  }
  if (jsonResponse) {
    // Add default JSON headers
    headers["Accept"] = "application/json";
  }
  if (extraHeaders) {
    extraHeaders.forEach(h => (headers[h.key] = h.value));
  }
  const params: RequestInit = {
    method,
    headers,
  };
  if (body && bodyHttpTypes.includes(method)) {
    if (jsonRequest) {
      params.body = JSON.stringify(body);
    } else {
      params.body = body as any;
    }
  }

  let responseHeaders: Record<string, string> = {};
  return Promise.race([
    fetch(url, params),
    // The promise below will never resolve
    new Promise((_, reject) =>
      setTimeout(() => {
        statusCode = 408; // Timeout status code
        const err: NetworkError = "TIMEOUT";
        reject(err);
      }, timeout),
    ),
  ])
    .then((res: unknown) => {
      // response will always be type 'Response'
      const response = res as Response;
      response.headers.forEach((value, key) => responseHeaders[key] = value);
      statusCode = response.status;
      switch(headers["Accept"]) {
        case "application/octet-stream":
          return response.blob();
        case "application/json":
          return response.json();
        case "multipart/form-data":
          return response.formData();
        default: 
          return response.text();
      }
    })
    .then((data: Return | Error) => {
      // Allow expecting something other than 200s
      const validStatusCode = isValidStatusCode(statusCode, {
        validStatusCodes,
        validStatusCodeStart,
        validStatusCodeEnd,
      });
      if (validStatusCode) {
        // Success - type is T
        const response: ISuccessResponse<Return> = {
          statusCode,
          data: data as Return,
          headers: responseHeaders, 
          status: "OK",
        };
        return response;
      } else {
        // Error - type is Error
        const response: IErrorResponse<Error> = {
          statusCode,
          errorData: data as Error,
          status: "ERROR",
        };
        return response;
      }
    })
    .catch((err: NetworkError | Error) => {
      // The error is either a timeout ('TIMEOUT'), a network error or a JSON parsing error
      // For now we're only handling the timeout, and calling all others 'OTHER'
      let networkError: NetworkError = err === "TIMEOUT" ? "TIMEOUT" : "OTHER";
      if (
        (err as any).hasOwnProperty("type") &&
        (err as any).type === "invalid-json"
      ) {
        networkError = "JSON_PARSING";
      }
      const response: INetworkErrorResponse = {
        statusCode,
        networkError,
        status: "NETWORK_ERROR",
      };
      return response;
    });
}

const isValidStatusCode = (
  statusCode: number,
  validation: IValidStatusCode,
) => {
  const {
    validStatusCodes,
    validStatusCodeStart,
    validStatusCodeEnd,
  } = validation;
  if (validStatusCodes) {
    return validStatusCodes.find(sc => sc === statusCode) !== undefined;
  }
  if (validStatusCodeStart && validStatusCodeEnd) {
    return (
      statusCode >= validStatusCodeStart && statusCode <= validStatusCodeEnd
    );
  }
  return false;
};
