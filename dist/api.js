"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function requestJson(url, method, body, extraHeaders, nonJsonRequest, validStatusCodes) {
    if (method === void 0) { method = "GET"; }
    var statusResponse = { networkError: false };
    var headers = new Headers();
    if (!nonJsonRequest) {
        // Add default JSON headers
        headers.append("Accept", "application/json");
        headers.append("Content-Type", "application/json");
    }
    if (extraHeaders) {
        extraHeaders.map(function (h) { return headers.append(h.key, h.value); });
    }
    var params = {
        method: method,
        headers: headers
    };
    if (body && (method === "POST" || method === "PATCH")) {
        params.body = JSON.stringify(body);
    }
    return fetch(url, params)
        .then(function (response) {
        statusResponse.statusCode = response.status;
        return response.json();
    })
        .then(function (json) {
        // Allow expecting something other than 200s
        var validStatusCode = validStatusCodes
            ? statusResponse.statusCode &&
                validStatusCodes.find(function (sc) { return sc === statusResponse.statusCode; }) !==
                    undefined
            : // Default is all 2xx status codes
                statusResponse.statusCode &&
                    statusResponse.statusCode >= 200 &&
                    statusResponse.statusCode < 300;
        if (validStatusCode) {
            // Success - type is T
            statusResponse.data = json;
        }
        else {
            // Error - type is ApiError
            statusResponse.errorData = json;
        }
        return statusResponse;
    })
        .catch(function () {
        // For now we assume all errors are network errors. They could potentially be JSON parsing errors as well
        statusResponse.networkError = true;
        return statusResponse;
    });
}
exports.requestJson = requestJson;
//# sourceMappingURL=api.js.map