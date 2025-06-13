import { createApp } from 'vue'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/icons.css'

import { createPinia } from 'pinia'
import router from './router'

// 配置全局axios拦截器
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getAccessToken, removeAccessToken } from './utils/auth'

// 设置axios默认配置
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999'
axios.defaults.timeout = 10000

console.log('当前环境:', import.meta.env.MODE)
console.log('API基础URL:', axios.defaults.baseURL)

// 请求拦截器 - 自动添加token
axios.interceptors.request.use(
  (config) => {
    // 自动添加token到请求头
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log('发送请求:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    })

    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 自动处理401和其他错误
axios.interceptors.response.use(
  (response) => {
    console.log('收到响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })

    return response
  },
  (error) => {
    console.error('响应错误:', error)

    if (error.response) {
      const { status, data } = error.response

      // 处理401未授权错误
      if (status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        removeAccessToken()
        router.push('/login')
        return Promise.reject(error)
      }

      // 处理其他HTTP错误
      const message = data?.message || data?.msg || `请求失败 (${status})`
      ElMessage.error(message)
    } else if (error.request) {
      // 网络错误
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      // 其他错误
      ElMessage.error('请求失败，请稍后重试')
    }

    return Promise.reject(error)
  }
)

const app = createApp(App)

app.use(ElementPlus)
app.use(createPinia())
app.use(router)

app.mount('#app')
