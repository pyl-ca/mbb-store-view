<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <h2>{{ registerType === 'user' ? '用户注册' : '管理员注册' }}</h2>
      </template>

      <!-- 注册类型切换 -->
      <div class="register-type-tabs">
        <div
          class="tab-item"
          :class="{ active: registerType === 'user' }"
          @click="switchRegisterType('user')"
        >
          <el-icon><User /></el-icon>
          普通用户
        </div>
        <div
          class="tab-item"
          :class="{ active: registerType === 'admin' }"
          @click="switchRegisterType('admin')"
        >
          <el-icon><Setting /></el-icon>
          管理员
        </div>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item prop="nickname">
          <el-input v-model="form.nickname" placeholder="昵称" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="mobile">
          <el-input v-model="form.mobile" placeholder="手机号" prefix-icon="Phone" />
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="邮箱" prefix-icon="Mail" />
        </el-form-item>
        <el-form-item prop="gender">
          <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item prop="captcha">
          <el-input v-model="form.captcha" placeholder="请输入图中数字验证码" style="width: 180px; margin-right: 10px;" />
          <img :src="captchaUrl" @click="refreshCaptcha" style="height: 32px; vertical-align: middle; cursor: pointer; border: 1px solid #eee; margin-right: 10px;" :alt="'点击刷新验证码'" />
          <el-tooltip content="点击图片刷新验证码"><el-icon style="vertical-align: middle;cursor:pointer;" @click="refreshCaptcha"><Refresh /></el-icon></el-tooltip>
        </el-form-item>

        <!-- 注册类型说明 -->
        <div class="register-notice">
          <el-alert
            :title="registerType === 'admin' ? '管理员注册说明' : '用户注册说明'"
            type="info"
            :closable="false"
            show-icon>
            <template #default>
              <div v-if="registerType === 'admin'">
                <p>• 创建管理员账号</p>
                <p>• 需要已登录的管理员权限</p>
                <p>• 新用户将自动分配管理员角色</p>
              </div>
              <div v-else>
                <p>• 创建普通用户账号</p>
                <p>• 注册后默认为普通用户角色</p>
                <p>• 可以访问商城进行购物</p>
              </div>
            </template>
          </el-alert>
        </div>
        <el-form-item>
          <el-button type="text" @click="goBack">返回</el-button>
          <el-button type="primary" @click="handleRegister" :loading="loading" block>注册</el-button>
        </el-form-item>
        <div class="form-footer">
          <el-link type="primary" @click="$router.push('/login')">已有账号？去登录</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Refresh, User, Setting } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import axios from 'axios'
import { onMounted } from 'vue'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const registerType = ref<'user' | 'admin'>('user')
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  email: '',
  nickname: '',
  mobile: '',
  gender: 1,
  captchaId: ''
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
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (_rule: any, value: string, callback: any) => {
      if (value !== form.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, message: '昵称至少2个字符', trigger: 'blur' }
  ],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}
async function getCaptcha() {
  try {
    // 根据注册类型选择不同的验证码接口
    const captchaEndpoint = registerType.value === 'admin'
      ? '/mbb-auth/auth/register/captcha/admin'
      : '/mbb-auth/auth/register/captcha/register'

    console.log('注册类型:', registerType.value)
    console.log('验证码接口地址:', captchaEndpoint)

    const response = await axios.get(captchaEndpoint, {
      headers: {
        Accept: 'image/jpeg'
      },
      responseType: 'blob'
    })
    captchaUrl.value = URL.createObjectURL(response.data)
    // 保存返回的 captcha-id
    form.captchaId = response.headers['captcha-id']
    console.log('获取验证码成功:', form.captchaId)
    console.log('响应头信息:', response.headers);
  } catch (error) {
    console.error('获取验证码失败:', error)
  }
}
async function handleRegister() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true

    console.log('开始注册，注册类型:', registerType.value)
    console.log('验证码ID:', form.captchaId)

    let response: any

    if (registerType.value === 'admin') {
      // 管理员注册（需要验证码）
      // 注意：这是管理员注册，不需要预先登录
      const requestData = {
        captchaId: form.captchaId,
        code: form.captcha,
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        mobile: form.mobile,
        email: form.email,
        gender: form.gender,
        roleIds: [1, 2] // 分配管理员角色 (ADMIN=1, MANAGER=2)
      }

      console.log('管理员注册数据:', requestData)

      response = await axios.post('/mbb-auth/auth/register/register/admin', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } else {
      // 普通用户注册（需要验证码）- 使用 JSON 格式
      const requestData = {
        captchaId: form.captchaId,
        code: form.captcha,
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        mobile: form.mobile,
        email: form.email,
        gender: form.gender
      }

      console.log('普通用户注册数据:', requestData)

      response = await axios.post('/mbb-auth/auth/register/register', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    console.log('注册响应:', response.data)

    if (response.data.code === '000000') {
      ElMessage.success('注册成功')
      console.log('注册成功，用户ID:', response.data.data)
      router.push('/login')
    } else {
      ElMessage.error(response.data.message || response.data.msg || '注册失败')
      console.error('注册失败，错误信息:', response.data)
    }
  } catch (error: any) {
    console.error('注册失败:', error)
    console.error('错误详情:', error.response?.data)
    ElMessage.error(error.response?.data?.message || error.response?.data?.msg || '注册失败，请稍后重试')
    // 注册失败后刷新验证码
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}
const goBack = () => {
  router.go(-1)
}
const captchaUrl = ref(getCaptchaUrl())
function getCaptchaUrl() {
  // 假设后端接口为 /api/captcha，带时间戳防止缓存
  return `/api/captcha?ts=${Date.now()}`
}
function refreshCaptcha() {
  getCaptcha();
  captchaUrl.value = getCaptchaUrl();
}
// 切换注册类型
function switchRegisterType(type: 'user' | 'admin') {
  registerType.value = type
  // 清空表单
  Object.assign(form, {
    username: '',
    password: '',
    confirmPassword: '',
    captcha: '',
    email: '',
    nickname: '',
    mobile: '',
    gender: 1,
    captchaId: ''
  })
  // 刷新验证码
  getCaptcha()
}

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

.register-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.register-subtitle {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.register-type-tabs {
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
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #666;
  background: transparent;
}

.tab-item:hover:not(.active) {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.tab-item.active {
  background: #667eea;
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.register-notice {
  margin-bottom: 20px;
}

.register-notice .el-alert {
  border-radius: 8px;
  border: 1px solid #e3f2fd;
  background: #f8f9fa;
}

.register-notice .el-alert__content p {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.4;
  color: #666;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: none;
  padding: 10px 14px;
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

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
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