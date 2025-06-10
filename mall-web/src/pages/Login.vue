<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>{{ loginType === 'user' ? '用户登录' : '管理员登录' }}</h2>
      </template>

      <!-- 登录类型切换 -->
      <div class="login-type-tabs">
        <div
          class="tab-item"
          :class="{ active: loginType === 'user' }"
          @click="switchLoginType('user')"
        >
          <el-icon><User /></el-icon>
          普通用户
        </div>
        <div
          class="tab-item"
          :class="{ active: loginType === 'admin' }"
          @click="switchLoginType('admin')"
        >
          <el-icon><Setting /></el-icon>
          管理员
        </div>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="captcha">
          <el-input
            v-model="form.captcha"
            placeholder="请输入图中数字验证码"
            style="width: 180px; margin-right: 10px;"
          />
          <img
            :src="captchaUrl"
            @click="refreshCaptcha"
            style="height: 32px; vertical-align: middle; cursor: pointer; border: 1px solid #eee; margin-right: 10px;"
            :alt="'点击刷新验证码'"
          />
          <el-tooltip content="点击图片刷新验证码">
            <el-icon style="vertical-align: middle;cursor:pointer;" @click="refreshCaptcha">
              <Refresh />
            </el-icon>
          </el-tooltip>
        </el-form-item>

        <!-- 登录类型说明 -->
        <div class="login-notice">
          <el-alert
            :title="loginType === 'admin' ? '管理员登录说明' : '用户登录说明'"
            type="info"
            :closable="false"
            show-icon>
            <template #default>
              <div v-if="loginType === 'admin'">
                <p>• 需要管理员权限才能登录</p>
                <p>• 登录后可访问管理后台</p>
                <p>• 普通用户无法使用此入口</p>
              </div>
              <div v-else>
                <p>• 普通用户和管理员都可使用</p>
                <p>• 登录后进入商城页面</p>
                <p>• 管理员可选择进入后台管理</p>
              </div>
            </template>
          </el-alert>
        </div>

        <el-form-item>
          <el-button type="text" @click="goBack">返回</el-button>
          <el-button type="primary" @click="handleLogin" :loading="loading" block>
            登录
          </el-button>
        </el-form-item>

        <div class="form-footer">
          <el-link type="primary" @click="$router.push('/register')">
            还没有账号？立即注册
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Setting, Refresh } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import axios from 'axios'


const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const loginType = ref<'user' | 'admin'>('user')
const captchaUrl = ref('')

const form = reactive({
  username: '',
  password: '',
  captcha: '',
  captchaId: '',
  token: ''
})



const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, message: '用户名至少2个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true

    console.log('开始登录，登录类型:', loginType.value)

    // 统一登录接口
    const response = await axios.post('/mbb-auth/auth/login', {
      username: form.username,
      password: form.password,
      clientType: loginType.value,
      captchaId: form.captchaId,
      captchaCode: form.captcha
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('登录响应:', response.data)

    if (response.data.code === '000000') {
      const data = response.data.data

      // 检查用户账号状态
      if (data.status === 0) {
        ElMessage.error('账号已被锁定，请联系管理员')
        return
      }

      // 获取用户角色
      const roles = data.roles || []
      const isAdmin = roles.some((role: string) =>
        role === 'ADMIN' || role === 'MANAGER' || role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER'
      )

      console.log('用户角色:', roles, '是否管理员:', isAdmin)

      // 权限判断：如果是普通用户尝试登录管理后台，则拒绝
      if (loginType.value === 'admin' && !isAdmin) {
        ElMessage.error('您没有管理员权限，无法访问管理后台')
        return
      }

      // 保存token和用户信息
      localStorage.setItem('access_token', data.accessToken)
      localStorage.setItem('token', data.accessToken)
      localStorage.setItem('refresh_token', data.refreshToken || '')
      localStorage.setItem('username', data.username || form.username)
      localStorage.setItem('userId', data.userId || data.id)
      localStorage.setItem('nickname', data.nickname || '')
      localStorage.setItem('avatar', data.avatar || '')
      localStorage.setItem('user_info', JSON.stringify(data))

      ElMessage.success('登录成功')

      // 触发登录事件，通知其他组件更新状态
      window.dispatchEvent(new CustomEvent('userLogin'))

      // 根据登录类型和权限跳转
      if (loginType.value === 'admin') {
        // 管理员登录跳转到后台管理
        router.push('/admin/dashboard')
      } else {
        // 用户登录跳转到商城首页
        router.push('/')
      }
    } else {
      const errorMsg = response.data.message || response.data.msg || '登录失败'
      ElMessage.error(errorMsg)
      // 如果是验证码错误，刷新验证码
      if (response.data.code === 'A00214' || errorMsg.includes('验证码')) {
        refreshCaptcha()
      }
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    console.error('错误详情:', error.response?.data)
    ElMessage.error(error.response?.data?.message || error.response?.data?.msg || '登录失败，请检查用户名和密码')
    // 登录失败后刷新验证码
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}

// 获取登录验证码
async function getCaptcha() {
  try {
    const response = await axios.get('/mbb-auth/auth/captcha/login', {
      headers: {
        Accept: 'image/jpeg'
      },
      responseType: 'blob'
    })
    captchaUrl.value = URL.createObjectURL(response.data)
    // 保存返回的 captcha-id
    form.captchaId = response.headers['captcha-id']
    console.log('获取登录验证码成功:', form.captchaId)
  } catch (error) {
    console.error('获取登录验证码失败:', error)
  }
}

// 刷新验证码
function refreshCaptcha() {
  getCaptcha()
}

// 切换登录类型
function switchLoginType(type: 'user' | 'admin') {
  loginType.value = type
  // 清空表单
  form.username = ''
  form.password = ''
  form.captcha = ''
  form.captchaId = ''
  // 刷新验证码
  getCaptcha()
}

// 组件挂载时获取验证码
onMounted(() => {
  getCaptcha()
})


</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.login-subtitle {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.login-type-tabs {
  display: flex;
  margin-bottom: 24px;
  border-radius: 8px;
  background: #f8f9fa;
  padding: 4px;
  border: 1px solid #e9ecef;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
}

.tab-item:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.tab-item.active {
  background: #667eea;
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.tab-item .el-icon {
  font-size: 16px;
}

.login-notice {
  margin-bottom: 20px;
}

.login-notice .el-alert {
  border-radius: 8px;
  border: 1px solid #e3f2fd;
  background: #f8f9fa;
}

.login-notice .el-alert__content p {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.4;
  color: #666;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: none;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #667eea;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

:deep(.el-input__inner) {
  font-size: 14px;
  color: #333;
}

:deep(.el-input__inner::placeholder) {
  color: #999;
}

:deep(.el-button--primary) {
  background: #667eea;
  border-color: #667eea;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  background: #5a6fd8;
  border-color: #5a6fd8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

:deep(.el-button--text) {
  color: #667eea;
  font-size: 14px;
}

:deep(.el-button--text:hover) {
  color: #5a6fd8;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}

:deep(.el-link--primary) {
  color: #667eea;
  font-size: 14px;
}

:deep(.el-link--primary:hover) {
  color: #5a6fd8;
}

/* 验证码图片样式 */
img[alt*="验证码"] {
  border-radius: 6px;
  border: 1px solid #e9ecef !important;
  transition: border-color 0.3s ease;
}

img[alt*="验证码"]:hover {
  border-color: #667eea !important;
}
</style>
