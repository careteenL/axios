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
