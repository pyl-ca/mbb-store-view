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
import { ElMessage } from 'element-plus'
import { User, Setting } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import axios from 'axios'


const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const loginType = ref<'user' | 'admin'>('user')

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

    // 根据登录类型调用不同的接口
    const response = await axios.post('http://localhost:9999/mbb-auth/auth/login', {
      username: form.username,
      password: form.password,
      clientType: loginType.value === 'admin' ? 'admin' : 'user'
    })

    if (response.data.code === '000000') {
      const data = response.data.data

      // 检查用户账号状态
      if (data.status === 0) {
        ElMessage.error('账号已被锁定，请联系管理员')
        return
      }

      // 保存token和用户信息
      localStorage.setItem('access_token', data.accessToken)
      localStorage.setItem('token', data.accessToken)
      localStorage.setItem('refresh_token', data.refreshToken)
      localStorage.setItem('username', form.username)
      localStorage.setItem('userId', data.id || data.userId)
      localStorage.setItem('user_info', JSON.stringify(data))

      ElMessage.success('登录成功')

      // 触发登录事件，通知其他组件更新状态
      window.dispatchEvent(new CustomEvent('userLogin'))

      // 根据登录类型跳转到不同页面
      if (loginType.value === 'admin') {
        // 管理员登录跳转到后台管理
        router.push('/admin/dashboard')
      } else {
        // 普通用户登录跳转到商城首页
        router.push('/')
      }
    } else {
      ElMessage.error(response.data.msg || '登录失败')
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error(error.response?.data?.msg || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}

// 切换登录类型
function switchLoginType(type: 'user' | 'admin') {
  loginType.value = type
  // 清空表单
  form.username = ''
  form.password = ''
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

.login-type-tabs {
  display: flex;
  margin-bottom: 24px;
  border-radius: 8px;
  background: #f5f5f5;
  padding: 4px;
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
  transition: all 0.3s;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.tab-item:hover {
  color: #409eff;
}

.tab-item.active {
  background: #fff;
  color: #409eff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-item .el-icon {
  font-size: 16px;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}
</style>
