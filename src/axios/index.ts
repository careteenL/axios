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
