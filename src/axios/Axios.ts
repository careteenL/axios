import qs from 'qs'
import parseHeaders from 'parse-headers'

import { AxiosRequestConfig, AxiosResponse, Methods } from './types';
import AxiosInterceptorManager, { OnFulfilled } from './AxiosInterceptorManager'
import { Interceptor } from './AxiosInterceptorManager'

let defaultConfig: AxiosRequestConfig = {
  url: '',
  methods: 'GET',
  timeout: 0,
  headers: {
    common: {
      accept: 'application/json',
    }
  },
  transformRequest: (data: Record<string, any>, headers: Record<string, any>) => {
    headers['common']['content-type'] = 'application/x-www-form-urlencoded'
    return JSON.stringify(data)
  },
  transformResponse: (response: any) => {
    if (typeof response === 'string') {
      return JSON.parse(response)
    }
    return response
  },
}

const getStyleMethods: Methods[] = ['get', 'head', 'delete', 'options']
const postStyleMethods: Methods[] = ['put', 'post', 'patch']
const allMethods:  Methods[] = [...getStyleMethods, ...postStyleMethods]

getStyleMethods.forEach((method: Methods) => {
  defaultConfig.headers![method] = {}
})
postStyleMethods.forEach((method: Methods) => {
  defaultConfig.headers![method] = {
    'content-type': 'application/json',
  }
})

export default class Axios<T = any> {
  public defaultConfig: AxiosRequestConfig = defaultConfig
  public interceptors = {
    request: new AxiosInterceptorManager<AxiosRequestConfig>(),
    response: new AxiosInterceptorManager<AxiosResponse<T>>(),
  }
  request(config: AxiosRequestConfig): Promise<any> {
    if (config.transformRequest && config.data) {
      config.data = config.transformRequest(config.data, config.headers = {})
    }
    config.headers = Object.assign(this.defaultConfig.headers, config.headers)
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
            if (config.transformResponse) {
              response.data = config.transformResponse(response.data)
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
            if (key === 'common' || allMethods.includes(key as Methods)) {
              if (key === 'common' || key === config.methods.toLowerCase()) {
                for (const key2 in headers[key]) {
                  if (Object.prototype.hasOwnProperty.call(headers[key], key2)) {
                    request.setRequestHeader(key2, headers[key][key2])
                  }
                }
              }
            } else {
              request.setRequestHeader(key, headers[key])
            }
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