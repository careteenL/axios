import qs from 'qs'
import parseHeaders from 'parse-headers'

import { AxiosRequestConfig, AxiosResponse } from './types'
import AxiosInterceptorManager, { OnFulfilled } from './AxiosInterceptorManager'
import { Interceptor } from './AxiosInterceptorManager';

export default class Axios<T = any> {
  public interceptors = {
    request: new AxiosInterceptorManager<AxiosRequestConfig>(),
    response: new AxiosInterceptorManager<AxiosResponse<T>>(),
  }
  request(config: AxiosRequestConfig): Promise<any> {
    const chain: Array<Interceptor<AxiosRequestConfig> | Interceptor<AxiosResponse<T>>> = [
      {
        onFulfilled: this.dispatchRequest as unknown as OnFulfilled<AxiosRequestConfig>,
      }
    ]
    // 请求拦截器 - 先添加后执行
    this.interceptors.request.interceptors.forEach((interceptor: Interceptor<AxiosRequestConfig> | null) => {
      interceptor && chain.unshift(interceptor)
    })
    // 响应拦截器 - 先添加先执行
    this.interceptors.response.interceptors.forEach((interceptor: Interceptor<AxiosResponse<T>> | null) => {
      interceptor && chain.push(interceptor)
    })
    // 按构造后的顺序执行
    let promise: Promise<any> = Promise.resolve(config)
    while (chain.length) {
      const { onFulfilled, onRejected } = chain.shift()!
      promise = promise.then(onFulfilled  as unknown as OnFulfilled<AxiosRequestConfig>, onRejected)
    }
    return promise
  }
  dispatchRequest(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return new Promise<AxiosResponse<T>>((resolve, reject) => {
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
              headers: parseHeaders(request.getAllResponseHeaders()),
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
      request.send(body)
    })
  }
}