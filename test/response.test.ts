import { request } from '../src/api'
import { FetchMock } from 'jest-fetch-mock'

// ts hack to avoid ts forgetting about fetchMock now and then
const fetchMock: FetchMock = (global as any).fetchMock

const url = 'https://test.com'

test('receives the correct data on request success', async () => {
  const responseData = { success: true }
  fetchMock.mockResponseOnce(JSON.stringify(responseData))
  const response = await request({
    url,
  })
  expect(response.status).toEqual('OK')
  if (response.status === 'OK') {
    expect(response.data).toEqual(responseData)
    expect(response.statusCode).toEqual(200)
  } else {
    expect(true).toBe(false)
  }
})

test('returns network error on timeout', async () => {
  fetchMock.mockResponseOnce(
    () =>
      new Promise(resolve => setTimeout(() => resolve({ body: 'ok' }), 100)),
  )
  const response = await request({
    url,
    timeout: 10,
  })
  expect(response.status).toEqual('NETWORK_ERROR')
  if (response.status === 'NETWORK_ERROR') {
    expect(response.networkError).toEqual('TIMEOUT')
    expect(response.statusCode).toEqual(408)
  } else {
    expect(true).toBe(false)
  }
})

test('returns error data parsed correctly', async () => {
  const responseData = { success: true }
  fetchMock.mockResponseOnce(JSON.stringify(responseData), { status: 403 })
  const response = await request({
    url,
  })
  expect(response.status).toEqual('ERROR')
  if (response.status === 'ERROR') {
    expect(response.errorData).toEqual(responseData)
    expect(response.statusCode).toEqual(403)
  } else {
    expect(true).toBe(false)
  }
})

test('respects provided valid status codes', async () => {
  const responseData = { success: true }
  fetchMock.mockResponseOnce(JSON.stringify(responseData), { status: 403 })
  const response = await request({
    url,
    validStatusCodes: [400, 401, 402, 403],
  })
  expect(response.status).toEqual('OK')
  if (response.status === 'OK') {
    expect(response.data).toEqual(responseData)
    expect(response.statusCode).toEqual(403)
  } else {
    expect(true).toBe(false)
  }
})

test('returns network error when response is not valid JSON', async () => {
  const responseData = 'non-JSON data'
  fetchMock.mockResponseOnce(responseData)
  const response = await request({
    url,
  })
  expect(response.status).toEqual('NETWORK_ERROR')
  if (response.status === 'NETWORK_ERROR') {
    expect(response.networkError).toEqual('JSON_PARSING')
    expect(response.statusCode).toEqual(200)
  } else {
    expect(true).toBe(false)
  }
})

test('returns valid data for non-JSON response', async () => {
  const responseData = 'non-JSON data'
  fetchMock.mockResponseOnce(responseData)
  const response = await request({
    url,
    jsonResponse: false,
  })
  expect(response.status).toEqual('OK')
  if (response.status === 'OK') {
    expect(response.data).toEqual(responseData)
    expect(response.statusCode).toEqual(200)
  } else {
    expect(true).toBe(false)
  }
})
