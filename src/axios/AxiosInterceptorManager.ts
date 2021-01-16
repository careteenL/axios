export interface OnFulfilled<V> {
  (value: V): V | PromiseLike<V> | undefined | null;
}

export interface OnRejected {
  (error: any): any;
}

export interface Interceptor<V> {
  onFulfilled?: OnFulfilled<V>;
  onRejected?: OnRejected;
}

export default class AxiosInterceptorManager<V> {
  public interceptors: Array<Interceptor<V> | null> = []
  use(onFulfilled?: OnFulfilled<V>, onRejected?: OnRejected): number {
    this.interceptors.push({
      onFulfilled,
      onRejected
    })
    return this.interceptors.length - 1
  }
  eject(id: number) {
    if (this.interceptors[id]) {
      this.interceptors[id] = null
    }
  }
}
