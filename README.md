# 使用Typescript实现轻量级Axios

## 目录

- 背景
- Axios原生使用及与其他请求库优缺点对比
- 搭建环境
- 实现`GET`
- 实现`POST`
- 实现错误处理机制
- 实现拦截器功能
- 实现任务取消功能

## 背景

## Axios原生使用及与其他请求库优缺点对比

## 搭建环境

本次实现先简易借助`create-react-app`快速创建可以快速预览的项目
```shell
npm i -g create-react-app
create-react-app axios --typescript
```

### 搭建简易后台提供接口
于此同时使用`express`在本地搭建一个配合`axios`的简易后台
```shell
npm i -g nodemon
yarn add express body-parser
```

在根目录下编写`server.js`文件
```js
// server.js
const express = require('express')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true,
}))

// set cors
app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.get('/get', (req, res) => {
  res.json(req.query)
})

app.listen(8080)

```

由于`create-react-app`启动默认端口为`3000`，使用`express`启动服务端口为`8080`，所以需要设置`cors`，以及先提供一个`http://localhost:8080/get`接口将传参直接返回。

### 安装原生Axios并使用

然后安装原生`axios`先查看简易使用
```shell
yarn add axios @types/axios qs @types/qs parse-headers
```

更改`src/index.tsx`文件
```tsx
// src/index.tsx
import axios, { AxiosResponse } from 'axios'

const BASE_URL = 'http://localhost:8080'

interface User {
  name: string;
  age: number;
}

const user: User = {
  name: 'Careteen',
  age: 25,
}

axios({
  method: 'GET',
  url: `${BASE_URL}/get`,
  params: user,
}).then((res: AxiosResponse) => {
  console.log('res: ', res);
  return res.data
}).then((data: User) => {
  console.log('data: ', data);
}).catch((err: any) => {
  console.log('err: ', err);
})
```
> 在`VsCode`中快速打印日志插件[vscode-extension-nidalee](https://github.com/careteenL/vscode-extension-nidalee)


### 查看效果

```shell
# 1. 启动后台服务
yarn server
# 2. 启动客户端
yarn start
```
浏览器访问 http://localhost:3000/ 打开控制台查看打印结果
![origin-log](https://careteenl.github.io/images/%40careteen/axios/origin-log.png)

### 分析传参和返回值

查看[aixos/index.d.ts](https://github.com/axios/axios/blob/master/index.d.ts)文件可得知axios所需参数和返回值类型定义如下
![request-config](https://careteenl.github.io/images/%40careteen/axios/request-config.jpg)
![response](https://careteenl.github.io/images/%40careteen/axios/response.jpg)

## 实现Axios

通过观察源码[axios/lib/axios.js](https://github.com/axios/axios/blob/master/lib/axios.js)以及其使用，可以发现`axios`是一个`promise`函数并且有`axios.interceptors.request`拦截器功能。

### createInstance

> 此处将源码进行简化便于理解
```ts
// axios/index.ts
import Axios from './Axios'
import { AxiosInstance } from './types'

const createInstance = (): AxiosInstance => {
  const context = new Axios()
  let instance = Axios.prototype.request.bind(context)
  instance = Object.assign(instance, Axios.prototype, context)
  return instance as unknown as AxiosInstance
}

const axios = createInstance()

export default axios

```
源码实现的方式较为巧妙

- 入口文件向外暴露`createInstance`函数；其内部核心主要是`new`一个`Axios`类实例`context`的同时，将`Axios`原型上的方法`request`(主要逻辑)的`this`始终绑定给`context`。目的是防止`this`指向出问题。
- 将`Axios`类原型上的所有属性以及实例`context`拷贝给上面`bind`后生成的新函数`instance`。目的是s可以在`axios`函数上挂载对象类似于拦截器的功能`axios.interceptors.request`方便使用方调用。

### 类型定义

从[分析传参和返回值](#分析传参和返回值)的截图可得知需定义的类型

> 此处将源码进行简化便于理解
```ts
// axios/types.ts
export type Methods = 
  | 'GET' | 'get'
  | 'POST' | 'post'
  | 'PUT' | 'put'
  | 'DELETE' | 'delete'
  | 'PATCH' | 'patch'
  | 'HEAD' | 'head'
  | 'OPTIONS' | 'options'

export interface AxiosRequestConfig {
  url: string;
  methods: Methods;
  params?: Record<string, any>;
}

export interface AxiosInstance {
  (config: AxiosRequestConfig): Promise<any>;
}

export interface AxiosResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  request?: any;
}

```

### Axios类实现GET方法

从上面的类型定义以及使用方式，再借助`XMLHttpRequest`去实现真正的发送请求。

步骤也是大家熟悉的四部曲
- 创建`XMLHttpRequest`实例`request`
- 调用`request.open()`配置`methods,url`
- 监听`request.onreadystatechange()`获取响应
- 调用`request.send()`发送请求

> 方便理解没有考虑兼容性
```ts
// axios/Axios.ts
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
        params
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
      request.send()
    })
  }
}
```
上面代码已经可以满足[安装原生Axios并使用](#安装原生Axios并使用)章节，下面将继续扩展其他方法。

### Axios类实现POST方法

首先在服务端扩展接口
```js
// server.js
app.post('/post', (req, res) => {
  res.json(req.body)
})
```

然后在使用时替换接口
```ts
// src/index.tsx
axios({
  method: 'POST',
  url: `${BASE_URL}/post`,
  data: user,
  headers: {
    'Content-Type': 'application/json',
  },
}).then((res: AxiosResponse) => {
  console.log('res: ', res);
  return res.data
}).then((data: User) => {
  console.log('data: ', data);
}).catch((err: any) => {
  console.log('err: ', err);
})
```

接着扩展类型
```ts
export interface AxiosRequestConfig {
  // ...
  data?: Record<string, any>;
  headers?: Record<string, any>;
}
```

最后扩展发请求核心逻辑

```ts
// axios/Axios.ts
let {
  // ...
  data,
  headers,
} = config
// ...
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
request.send(body)
```

## 实现错误处理机制

主要错误场景有以下三种
- 网络异常。断网
- 超时异常。接口耗时大于配置的`timeout`
- 错误状态码。`status < 200 || status >= 300`

```ts
// axios/Axios.ts
// 处理网络异常
request.onerror = () => {
  reject('net::ERR_INTERNET_DISCONNECTED')
}
// 处理超时异常
if (timeout) {
  request.timeout = timeout
  request.ontimeout = () => {
    reject(`Error: timeout of ${timeout}ms exceeded`)
  }
}
// 处理错误状态码
request.onreadystatechange = () => {
  if (request.readyState === 4) {
    if (request.status >= 200 && request.status < 300) {
      // ...
      resolve(response)
    } else {
      reject(`Error: Request failed with status code ${request.status}`)
    }
  }
}
```

### 模拟网络异常

刷新页面打开控制台`Network`，在5s内将`Online`改为`Offline`模拟断网。
```ts
// src/index.tsx
setTimeout(() => {
  axios({
    method: 'POST',
    url: `${BASE_URL}/post`,
    data: user,
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res: AxiosResponse) => {
    console.log('res: ', res)
    return res.data
  }).then((data: User) => {
    console.log('data: ', data)
  }).catch((err: any) => {
    console.log('err: ', err)
  })
}, 5000);
```
可正常捕获到错误
![error-offline](https://careteenl.github.io/images/%40careteen/axios/error-offline.jpg)

### 模拟超时异常

扩展服务端接口添加配置超时接口
```js
// server.js
app.post('/post_timeout', (req, res) => {
  let { timeout } = req.body
  if (timeout) {
    timeout = parseInt(timeout, 10)
  } else {
    timeout = 0
  }
  setTimeout(() => {
    res.json(req.body)
  }, timeout)
})
```

客户端调用超时接口
```ts
// src/index.tsx
axios({
  method: 'POST',
  url: `${BASE_URL}/post_timeout`,
  data: {
    timeout: 3000,
  },
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
}).then((res: AxiosResponse) => {
  console.log('res: ', res)
  return res.data
}).then((data: User) => {
  console.log('data: ', data)
}).catch((err: any) => {
  console.log('err: ', err)
})
```
可正常捕获到错误
![error-timeout](https://careteenl.github.io/images/%40careteen/axios/error-timeout.jpg)


### 模拟错误状态码

扩展服务端接口添加配置错误状态码接口
```js
// server.js
app.post('/post_status', (req, res) => {
  let { code } = req.body
  if (code) {
    code = parseInt(code, 10)
  } else {
    code = 200
  }
  res.statusCode = code
  res.json(req.body)
})
```

客户端调用错误状态码接口
```ts
// src/index.tsx
axios({
  method: 'POST',
  url: `${BASE_URL}/post_status`,
  data: {
    code: 502,
  },
  headers: {
    'Content-Type': 'application/json',
  },
}).then((res: AxiosResponse) => {
  console.log('res: ', res)
  return res.data
}).then((data: User) => {
  console.log('data: ', data)
}).catch((err: any) => {
  console.log('err: ', err)
})
```
可正常捕获到错误
![error-status](https://careteenl.github.io/images/%40careteen/axios/error-status.jpg)

## 拦截器功能

### 使用拦截器

服务端设置`cors`时为`Access-Control-Allow-Headers`添加一项`name`，方便后续使用拦截器设置请求头。
```js
// server.js
app.use((req, res, next) => {
  res.set({
    // ...
    'Access-Control-Allow-Headers': 'Content-Type, name',
  })
  // ...
})
```

在客户端使用`request和response`拦截器
```ts
// src/index.tsx
axios.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  config.headers.name += '1'
  return config
})
axios.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  config.headers.name += '2'
  return config
})
axios.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  config.headers.name += '3'
  return config
})

axios.interceptors.response.use((response: AxiosResponse): AxiosResponse => {
  response.data.name += '1'
  return response
})
axios.interceptors.response.use((response: AxiosResponse): AxiosResponse => {
  response.data.name += '2'
  return response
})
axios.interceptors.response.use((response: AxiosResponse): AxiosResponse => {
  response.data.name += '3'
  return response
})

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
```
 
查看请求头和响应体
![interceptor-request](https://careteenl.github.io/images/%40careteen/axios/interceptor-request.jpg)
![interceptor-response](https://careteenl.github.io/images/%40careteen/axios/interceptor-response.jpg)

得出拦截器的规律是
- 请求拦截器先添加的后执行
- 响应拦截器先添加的先执行

使用`axios.interceptors.request.eject`取消指定的拦截器
```ts
// src/index.tsx
axios.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  config.headers.name += '1'
  return config
})
const interceptor_request2 = axios.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  config.headers.name += '2'
  return config
})
// + 从同步改为异步
axios.interceptors.request.use((config: AxiosRequestConfig) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      config.headers.name += '3'
      resolve(config)
    }, 2000)
  })
})
// + 弹出`interceptor_request2`
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
// + 弹出`interceptor_response2`
axios.interceptors.response.eject(interceptor_response2)
```
查看请求头和响应体
![interceptor-request-eject](https://careteenl.github.io/images/%40careteen/axios/interceptor-request-eject.jpg)
![interceptor-response-eject](https://careteenl.github.io/images/%40careteen/axios/interceptor-response-eject.jpg)
