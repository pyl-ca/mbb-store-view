import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    // 开发服务器配置
    server: {
      host: '0.0.0.0',
      port: 5173,
      // 代理配置，解决跨域问题
      proxy: mode === 'development' ? {
        '/api': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      } : {}
    },
    // 定义全局常量替换
    define: {
      __DEV__: mode === 'development',
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_OPTIONS_API__: true
    }
  }
})
