import { IExtraHeader, request } from '../src/api'

const url = 'https://test.com'

const stubFetch = (
  callback: (requestUrl: RequestInfo, params: RequestInit) => void,
) => {
  jest.spyOn(global, 'fetch' as any).mockImplementationOnce(callback as any)
}

test('maps request params correctly', async () => {
  const method = 'PUT'
  const testHeader: IExtraHeader = { key: 'test', value: 'a value' }
  const body = 'test'
  stubFetch((requestUrl: RequestInfo, params: RequestInit) => {
    const headers = params.headers as Record<string, string>
    expect(requestUrl).toEqual(url)
    expect(params.method).toEqual(method)
    expect(headers['Content-Type']).toEqual('application/json')
    expect(headers['Accept']).toEqual('application/json')
    expect(headers[testHeader.key]).toEqual(testHeader.value)
    expect(Object.keys(headers).length).toBe(3)
    expect(params.body).toEqual(JSON.stringify(body))
  })
  await request({
    url,
    method,
    extraHeaders: [testHeader],
    body,
  })
})

test("doesn't add json request params", async () => {
  const method = 'POST'
  const testHeader: IExtraHeader = { key: 'test', value: 'a value' }
  const body = 'This is a test'
  stubFetch((requestUrl: RequestInfo, params: RequestInit) => {
    const headers = params.headers as Record<string, string>
    expect(requestUrl).toEqual(url)
    expect(params.method).toEqual(method)
    expect(headers).not.toHaveProperty('Content-Type')
    expect(headers[testHeader.key]).toEqual(testHeader.value)
    expect(Object.keys(headers).length).toBe(1)
    expect(params.body).toEqual(body)
  })
  await request({
    url,
    jsonResponse: false,
    jsonRequest: false,
    method,
    extraHeaders: [testHeader],
    body,
  })
})

test('strips away the body for non-body request', async () => {
  const method = 'GET'
  const body = 'This is a test'
  stubFetch((requestUrl: RequestInfo, params: RequestInit) => {
    expect(requestUrl).toEqual(url)
    expect(params.method).toEqual(method)
    expect(params.body).toBeUndefined
  })
  await request({
    url,
    method,
    body,
  })
})
