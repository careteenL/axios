import AxiosInterceptorManager from "./AxiosInterceptorManager"
import { CancelToken } from "./cancel"

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
  data?: Record<string, any>;
  headers?: Record<string, any>;
  timeout?: number; // ms
  transformRequest?: (data: Record<string, any>, headers: Record<string, any>) => any;
  transformResponse?: (data: any) => any;
  cancelToken?: Promise<any>;
}

export interface AxiosInstance {
  (config: AxiosRequestConfig): Promise<any>;
  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>
  };
  CancelToken: CancelToken;
  isCancel: (reaseon: any) => boolean;
}

export interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  request?: any;
}
