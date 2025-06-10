<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑用户' : '新增用户'"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="form.username"
          placeholder="请输入用户名（支持中文、字母、数字、下划线，2-20位）"
          :disabled="isEdit"
        />
      </el-form-item>

      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="form.nickname"
          placeholder="请输入昵称"
        />
      </el-form-item>

      <el-form-item v-if="!isEdit" label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码（6-20位）"
          show-password
        />
      </el-form-item>

      <el-form-item label="手机号" prop="mobile">
        <el-input
          v-model="form.mobile"
          placeholder="请输入手机号"
        />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="form.email"
          placeholder="请输入邮箱"
        />
      </el-form-item>

      <el-form-item label="性别" prop="gender">
        <el-radio-group v-model="form.gender">
          <el-radio :label="1">男</el-radio>
          <el-radio :label="2">女</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :label="1">正常</el-radio>
          <el-radio :label="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="角色" prop="roleId">
        <el-select
          v-model="form.roleId"
          placeholder="请选择角色"
          style="width: 100%"
        >
          <el-option
            v-for="role in roles"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="头像" prop="avatar">
        <div class="avatar-uploader">
          <div class="avatar-upload" @click="triggerFileInput">
            <img
              v-if="form.avatar"
              :src="avatarUrl"
              class="avatar"
              @load="() => console.log('头像加载成功:', avatarUrl)"
              @error="() => console.error('头像加载失败:', avatarUrl)"
            />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </div>
          <div class="avatar-tip">点击上传头像</div>
          <div v-if="form.avatar" class="avatar-debug">
            <small>头像路径: {{ form.avatar }}</small>
          </div>
          <input
            type="file"
            ref="fileInput"
            style="display: none"
            accept="image/jpeg,image/png"
            @change="handleFileChange"
          />
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type UploadProps } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { adminUserApi } from '../../api/admin-user'
import axios from 'axios'
import type { AdminUser, CreateUserRequest, UpdateUserRequest, Role } from '../../types/admin-user'
import { API_BASE_URL } from '../../api/config'

interface Props {
  visible: boolean
  userData?: AdminUser | null
  roles: Role[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  userData: null
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// 判断是否为编辑模式
const isEdit = computed(() => !!props.userData)

// 表单数据
const form = reactive({
  username: '',
  nickname: '',
  password: '',
  mobile: '',
  email: '',
  gender: 1,
  status: 1,
  avatar: '',
  roleId: undefined as number | undefined
})

// 头像URL计算
const avatarUrl = computed(() => {
  if (!form.avatar) return ''

  console.log('计算头像URL，原始值:', form.avatar)

  // 如果已经是完整的HTTP URL，直接返回
  if (form.avatar.startsWith('http')) {
    console.log('返回完整URL:', form.avatar)
    return form.avatar
  }

  // 如果是相对路径，拼接基础URL
  let fullUrl = ''
  if (form.avatar.startsWith('/uploads/')) {
    fullUrl = `${API_BASE_URL}/user-service${form.avatar}`
  } else if (form.avatar.startsWith('/')) {
    fullUrl = `${API_BASE_URL}${form.avatar}`
  } else {
    fullUrl = `${API_BASE_URL}/user-service/uploads/${form.avatar}`
  }

  console.log('拼接后的URL:', fullUrl)
  return fullUrl
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    {
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/,
      message: '用户名可以包含中文、字母、数字、下划线，长度2-20位',
      trigger: 'blur'
    }
  ],
  nickname: [
    { min: 2, max: 50, message: '昵称长度为2-50位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度必须在6-20位之间', trigger: 'blur' }
  ],
  mobile: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择用户角色', trigger: 'change' }
  ]
}

// 监听用户数据变化，填充表单
watch(() => props.userData, (userData) => {
  if (userData) {
    Object.assign(form, {
      username: userData.username,
      nickname: userData.nickname || '',
      password: '',
      mobile: userData.mobile || '',
      email: userData.email || '',
      gender: userData.gender || 1,
      status: userData.status,
      avatar: userData.avatar || '',
      roleId: userData.roleIds && userData.roleIds.length > 0 ? userData.roleIds[0] : undefined
    })
  } else {
    // 重置表单
    Object.assign(form, {
      username: '',
      nickname: '',
      password: '',
      mobile: '',
      email: '',
      gender: 1,
      status: 1,
      avatar: '',
      roleId: undefined
    })
  }
}, { immediate: true })

// 处理关闭
function handleClose() {
  emit('update:visible', false)
  formRef.value?.resetFields()
}

// 处理提交
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    if (isEdit.value) {
      // 更新用户
      const updateData: UpdateUserRequest = {
        id: props.userData!.id,
        nickname: form.nickname,
        mobile: form.mobile,
        email: form.email,
        gender: form.gender,
        status: form.status,
        avatar: form.avatar,
        roleIds: form.roleId ? [form.roleId] : []
      }
      await adminUserApi.updateUser(updateData)
    } else {
      // 创建用户
      const createData: CreateUserRequest = {
        username: form.username,
        nickname: form.nickname,
        password: form.password,
        mobile: form.mobile,
        email: form.email,
        gender: form.gender,
        status: form.status,
        avatar: form.avatar,
        roleIds: form.roleId ? [form.roleId] : []
      }
      await adminUserApi.createUser(createData)
    }

    emit('success')
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    handleClose()
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error.message || (isEdit.value ? '更新失败' : '创建失败'))
  } finally {
    loading.value = false
  }
}

// 触发文件选择
function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 处理文件选择
async function handleFileChange(event: Event) {
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
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    const response = await axios.put(
      '/user-service/api/v1/profile/avatar',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    // 处理上传结果
    console.log('头像上传响应:', response.data)
    if (response.data.code === '000000' || response.data.success === true) {
      ElMessage.success('头像上传成功')
      // 根据实际API响应结构设置头像
      // 可能的响应格式：
      // 1. response.data.data.avatar
      // 2. response.data.data.url
      // 3. response.data.data (直接是URL字符串)
      // 4. response.data.avatar
      const avatarUrl = response.data.data?.avatar ||
                       response.data.data?.url ||
                       response.data.data ||
                       response.data.avatar ||
                       response.data.url

      if (avatarUrl) {
        form.avatar = avatarUrl
        console.log('设置头像URL:', avatarUrl)
      } else {
        console.warn('未找到头像URL，响应数据:', response.data)
        ElMessage.warning('头像上传成功，但未获取到头像地址')
      }
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

// 头像上传前验证
function beforeAvatarUpload(file: File): boolean {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}
</script>

<style scoped>
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.avatar-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 78px;
  height: 78px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-upload .avatar {
  width: 78px;
  height: 78px;
  display: block;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.avatar-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 8px;
}

.avatar-debug {
  margin-top: 4px;
  font-size: 10px;
  color: #909399;
  word-break: break-all;
}
</style>
