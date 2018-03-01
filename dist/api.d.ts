export interface IJsonStatus<T = any, E = any> {
    data?: T;
    errorData?: E;
    statusCode?: number;
    networkError: boolean;
}
export declare type httpType = 'GET' | 'POST' | 'PUT' | 'PATCH';
export interface IExtraHeader {
    key: string;
    value: string;
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
export declare function requestJson<T, E>(url: string, method?: httpType, body?: object, extraHeaders?: IExtraHeader[], nonJsonRequest?: boolean, validStatusCodes?: number[]): Promise<IJsonStatus<T, E>>;
