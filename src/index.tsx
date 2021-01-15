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