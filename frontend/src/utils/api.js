import axios from 'axios'

const api = axios.create({
  // baseURL: 'http://128.199.185.84:5000/api'
  baseURL: '/api'
})

export default api


