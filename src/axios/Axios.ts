import qs, { parse } from 'qs'
import { AxiosRequestConfig, AxiosResponse } from './types'

export default class Axios {
  request(config: AxiosRequestConfig): Promise<any> {
    return this.dispatchRequest(config)
  }
  dispatchRequest(config: AxiosRequestConfig) {
    return new Promise((resolve, reject) => {
      let {
        url,
        methods = 'GET',
        params,
        data,
        headers,
        timeout = 0,
      } = config
      const request: XMLHttpRequest = new XMLHttpRequest()
      if (params) {
        const paramsStr = qs.stringify(params)
        if (url.indexOf('?') === -1) {
          url += `?${paramsStr}`
        } else {
          url += `&${paramsStr}`
        }
      }
      request.open(methods, url, true)
      request.responseType = 'json'
      request.onreadystatechange = () => {
        if (request.readyState === 4) {
          if (request.status >= 200 && request.status < 300) {
            const response: AxiosResponse<any> = {
              data: request.response,
              status: request.status,
              statusText: request.statusText,
              headers: parse(request.getAllResponseHeaders()),
              config,
              request,
            }
            resolve(response)
          } else {
            reject(`Error: Request failed with status code ${request.status}`)
          }
        }
      }
      if (headers) {
        for (const key in headers) {
          if (Object.prototype.hasOwnProperty.call(headers, key)) {
            request.setRequestHeader(key, headers[key])
          }
        }
      }
      let body: string | null = null;
      if (data && typeof data === 'object') {
        body = JSON.stringify(data)
      }
      request.onerror = () => {
        reject('net::ERR_INTERNET_DISCONNECTED')
      }
      if (timeout) {
        request.timeout = timeout
        request.ontimeout = () => {
          reject(`Error: timeout of ${timeout}ms exceeded`)
        }
      }
      request.send()
    })
  }
}