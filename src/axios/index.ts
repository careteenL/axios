import Axios from './Axios'
import { AxiosInstance } from './types'
import { CancelToken, isCancel } from './cancel'

const createInstance = (): AxiosInstance => {
  const context = new Axios()
  let instance = Axios.prototype.request.bind(context)
  instance = Object.assign(instance, Axios.prototype, context)
  return instance as unknown as AxiosInstance
}

const axios = createInstance()
axios.CancelToken = new CancelToken()
axios.isCancel = isCancel

export default axios
export * from './types'
