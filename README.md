# ts-fetch

[![npm version](https://badge.fury.io/js/ts-fetch.svg)](https://www.npmjs.com/package/ts-fetch)
[![GitHub version](https://badge.fury.io/gh/erik-beus%2Fts-fetch.svg)](https://github.com/erik-beus/ts-fetch/releases)
[![CircleCI](https://circleci.com/gh/erik-beus/ts-fetch/tree/master.svg?style=svg)](https://circleci.com/gh/erik-beus/ts-fetch/tree/master)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/erik-beus/ts-fetch/pulls)

Small wrapper around `fetch` making it possible to have type safety around network requests.
By passing generics it's possible to indicate which types are expected on success/error and work directly with those types.
`ts-fetch` is slightly opinionated, but it's possible to override all settings. These are the default settings:
```ts
const defaultRequestParams = {
  method: 'GET',
  jsonRequest: true,
  jsonResponse: true,
  validStatusCodeStart: 200,
  validStatusCodeEnd: 299,
  timeout: 12000, // 12 seconds default timeout
}
```
If the response is not a valid JSON response and the `jsonResponse` was set to `true`, the request would return an error.

## Example usages
### Basic request with no arguments
```ts
const response = await request<{name: string}, {errorCode: number}>({
  url: 'https://myapi.com'
})
if (response.status === 'OK') {
  // Work with response.data in a typesafe way 👍
}
```
### Request with custom arguments and a non-JSON response
```ts
const response = await request<never, { errorCode: number }>({
  url: 'https://myapi.com',
  body: { name: 'Updated name of user' },
  method: 'PUT',
  jsonResponse: false, // Response will not be in JSON
  timeout: 1000, // Only 1 second timeout
  validStatusCodes: [201], // Only 201 indicates success
  extraHeaders: [{ key: 'Secret', value: '2lknf3oihvls' }],
})
if (response.status === 'OK') {
  // Things went well 👍
} else if (response.status === 'NETWORK_ERROR') {
  // Handle network error
} else {
  // Work with the returned error data that you expect in your response
}
```

### Request blob data, read return headers
```ts
const response = await request<Blob, never>({
  url: 'https://myapi.com',
  method: 'POST',
  jsonResponse: false, // Response will not be in JSON
  extraHeaders: [{ key: 'Accept', value: 'application/octet-stream' }],
})
if (response.status === 'OK') {
  // Things went well 👍

  // Useful for example for injecting img src with data from the response
  console.log(URL.createObjectURL(response.data));
  console.log(response.headers['content-type']);
} else if (response.status === 'NETWORK_ERROR') {
  // Handle network error
} else {
  // Work with the returned error data that you expect in your response
}
```

