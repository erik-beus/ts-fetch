"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var defaultRequestParams = {
    method: 'GET',
    jsonRequest: true,
    jsonResponse: true,
    validStatusCodeStart: 200,
    validStatusCodeEnd: 299,
};
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
function requestJson(requestParams) {
    var processedParams = tslib_1.__assign({}, defaultRequestParams, requestParams);
    var url = processedParams.url, method = processedParams.method, body = processedParams.body, extraHeaders = processedParams.extraHeaders, jsonResponse = processedParams.jsonResponse, jsonRequest = processedParams.jsonRequest, validStatusCodes = processedParams.validStatusCodes, validStatusCodeStart = processedParams.validStatusCodeStart, validStatusCodeEnd = processedParams.validStatusCodeEnd;
    var statusResponse = { networkError: false };
    var headers = new Headers();
    if (jsonRequest) {
        // Add default JSON headers
        headers.append('Content-Type', 'application/json');
    }
    if (jsonResponse) {
        headers.append('Accept', 'application/json');
        // Add default JSON headers
    }
    if (extraHeaders) {
        extraHeaders.map(function (h) { return headers.append(h.key, h.value); });
    }
    var params = {
        method: method,
        headers: headers,
    };
    if (body && (method === 'POST' || method === 'PATCH')) {
        params.body = JSON.stringify(body);
    }
    return fetch(url, params)
        .then(function (response) {
        statusResponse.statusCode = response.status;
        if (jsonResponse) {
            return response.json();
        }
        else {
            return response;
        }
    })
        .then(function (json) {
        // Allow expecting something other than 200s
        var validStatusCode = isValidStatusCode(statusResponse.statusCode, {
            validStatusCodes: validStatusCodes,
            validStatusCodeStart: validStatusCodeStart,
            validStatusCodeEnd: validStatusCodeEnd,
        });
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
var isValidStatusCode = function (statusCode, validation) {
    var validStatusCodes = validation.validStatusCodes, validStatusCodeStart = validation.validStatusCodeStart, validStatusCodeEnd = validation.validStatusCodeEnd;
    if (validStatusCodes) {
        return validStatusCodes.find(function (sc) { return sc === statusCode; }) !== undefined;
    }
    if (validStatusCodeStart && validStatusCodeEnd) {
        return (statusCode >= validStatusCodeStart && statusCode <= validStatusCodeEnd);
    }
    return false;
};
//# sourceMappingURL=api.js.map