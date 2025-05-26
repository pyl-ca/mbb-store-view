<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>用户登录</h2>
      </template>
      
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance } from 'element-plus'
import axios from 'axios'


const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  token:''
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
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    const response = await axios.post('http://localhost:9999/mbb-auth/oauth/token', new URLSearchParams({
      username: form.username,
      password: form.password,
      grant_type: 'password'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa('ams:ams')
      }
    })
    const token = response.data.data.access_token
    form.token = token
    // 登录成功后将token存入localStorage
    localStorage.setItem('access_token', token)
    localStorage.setItem('username', form.username)
    const userExists = await checkUserExists(form.username);
    if (userExists) {
      const userInfo = await getUserInfo(form.username);
      // 登录成功后将用户信息存入localStorage
      if (userInfo) {
        localStorage.setItem('user_info', JSON.stringify(userInfo))
      }
      console.log('User Info:', userInfo);
      router.push('/'); // 登录成功后跳转到首页
    } else {
      console.error('用户不存在');
    }
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}


async function checkUserExists(username: string) {
  try {
    const response = await axios.get(`http://localhost:9999/mbb-admin/api/v1/users/exists?username=${username}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer ' + form.token
      }
    })
    return response.data.success
  } catch (error) {
    console.error('检查用户存在性失败:', error)
    return false
  }
}

async function getUserInfo(username: string) {
  try {
    const response = await axios.get(`http://localhost:9999/mbb-admin/api/v1/users/username/${username}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer ' + form.token
      }
    })
    return response.data.data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 70px);
  background: #f5f5f5;
}

.login-card {
  width: 400px;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}
</style>
