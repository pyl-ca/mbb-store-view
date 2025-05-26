<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <h2>用户注册</h2>
      </template>
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
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="邮箱" prefix-icon="Mail" />
        </el-form-item>
        <el-form-item prop="captcha">
          <el-input v-model="form.captcha" placeholder="请输入图中数字验证码" style="width: 180px; margin-right: 10px;" />
          <img :src="captchaUrl" @click="refreshCaptcha" style="height: 32px; vertical-align: middle; cursor: pointer; border: 1px solid #eee; margin-right: 10px;" :alt="'点击刷新验证码'" />
          <el-tooltip content="点击图片刷新验证码"><el-icon style="vertical-align: middle;cursor:pointer;" @click="refreshCaptcha"><Refresh /></el-icon></el-tooltip>
        </el-form-item>
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
import { Refresh } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import type { FormInstance } from 'element-plus'
import axios from 'axios'
import { onMounted } from 'vue'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  email: '',
  captchaId: ''
})
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (rule: any, value: string, callback: any) => {
      if (value !== form.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}
async function getCaptcha() {
  try {
    const response = await axios.get('http://localhost:9999/mbb-auth/auth/register/captcha/register', {
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
    const response = await axios.post('http://localhost:9999/mbb-auth/auth/register/register', {
      username: form.username,
      password: form.password,
      email: form.email,
      code: form.captcha
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      params: { captchaId: form.captchaId ,code: form.captcha}
    })
    console.log('注册成功:', response.data)
    router.push('/login')
  } catch (error) {
    console.error('注册失败:', error)
    console.log(form.captchaId)
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
onMounted(() => {
  getCaptcha()
})
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 70px);
  background: #f5f5f5;
}
.register-card {
  width: 400px;
}
.form-footer {
  text-align: center;
  margin-top: 20px;
}
</style>