<template>
  <div class="user-profile-container">
    <h2 class="page-title">个人资料</h2>
    <el-divider />

    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="100px"
      class="profile-form"
    >
      <!-- 头像上传 -->
      <el-form-item label="头像">
        <div class="avatar-uploader">
          <div class="avatar-upload" @click="triggerFileInput">
            <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            <input
              type="file"
              ref="fileInput"
              style="display: none"
              accept="image/jpeg,image/png"
              @change="handleFileChange"
            />
          </div>
          <div class="avatar-tip">点击上传头像</div>
        </div>
      </el-form-item>

      <!-- 用户名 -->
      <el-form-item label="用户名">
        <span>{{ form.username }}</span>
      </el-form-item>

      <!-- 昵称 -->
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入昵称" />
      </el-form-item>

      <!-- 性别 -->
      <el-form-item label="性别" prop="gender">
        <el-radio-group v-model="form.gender">
          <el-radio :label="1">男</el-radio>
          <el-radio :label="2">女</el-radio>
          <el-radio :label="0">保密</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 手机号 -->
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="form.mobile" placeholder="请输入手机号" />
      </el-form-item>

      <!-- 邮箱 -->
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>

      <!-- 提交按钮 -->
      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="loading">保存修改</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import type { FormInstance, FormRules } from 'element-plus'

// 表单引用
const formRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)

// 表单数据
const form = reactive({
  id: 0,
  username: '',
  nickname: '',
  gender: 0,
  avatar: '',
  mobile: '',
  email: '',
  status: 1
})

// 表单验证规则
const rules = reactive<FormRules>({
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  mobile: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
})

// 头像URL
const avatarUrl = computed(() => {
  if (!form.avatar) {
    return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
  }
  if (form.avatar.startsWith('http')) {
    return form.avatar
  }
  // 头像存储在服务器的uploads目录下，直接访问
  return `http://localhost:9999${form.avatar}`
})

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null)

// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 处理文件选择
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  if (!beforeAvatarUpload(file)) return

  // 显示加载状态
  loading.value = true

  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', file)

    // 发送PUT请求上传头像
    const token = localStorage.getItem('access_token')
    const response = await axios.put(
      'http://localhost:9999/user-service/api/v1/profile/avatar',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    // 处理上传结果
    if (response.data.code === '000000') {
      ElMessage.success('头像上传成功')
      fetchUserInfo() // 重新获取用户信息，包括新的头像URL
    } else {
      ElMessage.error(response.data.msg || '头像上传失败')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    ElMessage.error('头像上传失败')
  } finally {
    loading.value = false
    // 重置文件输入，以便可以再次选择同一文件
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const response = await axios.get('http://localhost:9999/user-service/api/v1/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.data.code === '000000') {
      const userData = response.data.data
      console.log('获取到的用户数据:', userData)
      console.log('头像路径:', userData.avatar)

      Object.keys(form).forEach(key => {
        if (key in userData) {
          form[key] = userData[key]
        }
      })

      // 打印计算后的头像URL
      console.log('计算后的头像URL:', avatarUrl.value)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const token = localStorage.getItem('access_token')
    const response = await axios.put('http://localhost:9999/user-service/api/v1/profile', {
      nickname: form.nickname,
      gender: form.gender,
      mobile: form.mobile,
      email: form.email
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.data.code === '000000') {
      ElMessage.success('个人资料更新成功')
    } else {
      ElMessage.error(response.data.msg || '更新失败')
    }
  } catch (error) {
    console.error('更新个人资料失败:', error)
    ElMessage.error('更新个人资料失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const resetForm = () => {
  fetchUserInfo()
}

// 头像上传成功回调
const handleAvatarSuccess = (response: any) => {
  if (response.code === '000000') {
    ElMessage.success('头像上传成功')
    fetchUserInfo() // 重新获取用户信息，包括新的头像URL
  } else {
    ElMessage.error(response.msg || '头像上传失败')
  }
}

// 头像上传前的验证
const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.user-profile-container {
  width: 100%;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
}

.profile-form {
  max-width: 600px;
  margin-top: 30px;
}

.avatar-uploader {
  text-align: center;
  margin-bottom: 20px;
}

.avatar-upload {
  display: inline-block;
  cursor: pointer;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
}

.avatar-uploader-icon:hover {
  border-color: #409EFF;
}

.avatar-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>
