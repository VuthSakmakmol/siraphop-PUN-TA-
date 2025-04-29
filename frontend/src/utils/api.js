import axios from 'axios'

const api = axios.create({
  baseURL: 'http://128.199.185.84:5000/api'
//   baseURL: 'http://localhost:5000/api'
})

export default api
