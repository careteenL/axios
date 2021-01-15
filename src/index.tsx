import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

const BASE_URL = 'http://localhost:8080'

interface User {
  name: string;
  age: number;
}

const user: User = {
  name: 'Careteen',
  age: 25,
}

axios.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  config.headers.name += '1'
  return config
})
const interceptor_request2 = axios.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  config.headers.name += '2'
  return config
})
axios.interceptors.request.use((config: AxiosRequestConfig) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      config.headers.name += '3'
      resolve(config)
    }, 2000)
  })  
})
axios.interceptors.request.eject(interceptor_request2)

axios.interceptors.response.use((response: AxiosResponse): AxiosResponse => {
  response.data.name += '1'
  return response
})
const interceptor_response2 = axios.interceptors.response.use((response: AxiosResponse): AxiosResponse => {
  response.data.name += '2'
  return response
})
axios.interceptors.response.use((response: AxiosResponse): AxiosResponse => {
  response.data.name += '3'
  return response
})
axios.interceptors.response.eject(interceptor_response2)

// 使用拦截器
axios({
  method: 'GET',
  url: `${BASE_URL}/get`,
  params: user,
  headers: {
    'Content-Type': 'application/json',
    'name': 'Careteen',
  },
}).then((res: AxiosResponse) => {
  console.log('res: ', res)
  return res.data
}).then((data: User) => {
  console.log('data: ', data)
}).catch((err: any) => {
  console.log('err: ', err)
})

// 使用 POST - 发送接口5s内断网
// setTimeout(() => {
//   axios({
//     method: 'POST',
//     url: `${BASE_URL}/post`,
//     data: user,
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   }).then((res: AxiosResponse) => {
//     console.log('res: ', res)
//     return res.data
//   }).then((data: User) => {
//     console.log('data: ', data)
//   }).catch((err: any) => {
//     console.log('err: ', err)
//   })
// }, 5000);

// 使用 POST - 错误状态码
// axios({
//   method: 'POST',
//   url: `${BASE_URL}/post_status`,
//   data: {
//     code: 502,
//   },
//   headers: {
//     'Content-Type': 'application/json',
//   },
// }).then((res: AxiosResponse) => {
//   console.log('res: ', res)
//   return res.data
// }).then((data: User) => {
//   console.log('data: ', data)
// }).catch((err: any) => {
//   console.log('err: ', err)
// })

// 使用 POST - 接口超时
// axios({
//   method: 'POST',
//   url: `${BASE_URL}/post_timeout`,
//   data: {
//     timeout: 3000,
//   },
//   timeout: 1000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// }).then((res: AxiosResponse) => {
//   console.log('res: ', res)
//   return res.data
// }).then((data: User) => {
//   console.log('data: ', data)
// }).catch((err: any) => {
//   console.log('err: ', err)
// })

// 正常使用 POST
// axios({
//   method: 'POST',
//   url: `${BASE_URL}/post`,
//   data: user,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// }).then((res: AxiosResponse) => {
//   console.log('res: ', res)
//   return res.data
// }).then((data: User) => {
//   console.log('data: ', data)
// }).catch((err: any) => {
//   console.log('err: ', err)
// })

// 使用 GET
// axios({
//   method: 'GET',
//   url: `${BASE_URL}/get`,
//   params: user,
// }).then((res: AxiosResponse) => {
//   console.log('res: ', res)
//   return res.data
// }).then((data: User) => {
//   console.log('data: ', data)
// }).catch((err: any) => {
//   console.log('err: ', err)
// })