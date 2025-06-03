<template>
  <div class="user-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button @click="loadUsers" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="用户名">
          <el-input v-model="filterForm.username" placeholder="请输入用户名" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="filterForm.nickname" placeholder="请输入昵称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="filterForm.mobile" placeholder="请输入手机号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="filterForm.email" placeholder="请输入邮箱" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 100px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="filterForm.gender" placeholder="请选择性别" clearable style="width: 100px">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色筛选">
          <el-select v-model="filterForm.roleId" placeholder="请选择角色" clearable style="width: 150px">
            <el-option label="全部角色" :value="undefined" />
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchUsers">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 批量操作 -->
    <div class="batch-actions" v-if="selectedUsers.length > 0">
      <span class="selected-info">已选择 {{ selectedUsers.length }} 项</span>
      <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
      <el-button type="warning" size="small" @click="handleBatchLock">批量锁定</el-button>
      <el-button type="success" size="small" @click="handleBatchUnlock">批量解锁</el-button>
    </div>

    <!-- 用户列表 -->
    <div class="table-section">
      <el-table
        :data="users"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.gender === 1 ? 'primary' : 'success'">
              {{ row.gender === 1 ? '男' : '女' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="roleNames" label="角色" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.roleNames" size="small">{{ row.roleNames }}</el-tag>
            <span v-else class="text-gray">未分配</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="handleResetPassword(row)">重置密码</el-button>
            <el-dropdown @command="(command) => handleDropdownCommand(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="`${row.status === 1 ? 'lock' : 'unlock'}`">
                    {{ row.status === 1 ? '锁定' : '解锁' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="roles">分配角色</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </div>

    <!-- 用户表单对话框 -->
    <UserForm
      v-model:visible="formVisible"
      :userData="currentUser"
      :roles="roles"
      @success="handleFormSuccess"
    />

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordVisible" title="重置密码" width="400px">
      <el-form :model="resetPasswordForm" :rules="resetPasswordRules" ref="resetPasswordFormRef">
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmResetPassword" :loading="resetPasswordLoading">
          确认重置
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配角色对话框 -->
    <el-dialog v-model="assignRolesVisible" title="分配角色" width="400px">
      <el-form>
        <el-form-item label="选择角色">
          <el-select v-model="assignRolesForm.roleIds" multiple placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignRolesVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssignRoles" :loading="assignRolesLoading">
          确认分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { adminUserApi } from '../../api/admin-user'
import UserForm from '../../components/admin/UserForm.vue'
import type { AdminUser, UserFilter, Role } from '../../types/admin-user'

// 数据定义
const loading = ref(false)
const users = ref<AdminUser[]>([])
const roles = ref<Role[]>([])
const selectedUsers = ref<AdminUser[]>([])

// 筛选表单
const filterForm = reactive<UserFilter>({
  username: '',
  nickname: '',
  mobile: '',
  email: '',
  status: undefined,
  gender: undefined,
  roleId: undefined
})

// 分页
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 表单相关
const formVisible = ref(false)
const currentUser = ref<AdminUser | null>(null)

// 重置密码相关
const resetPasswordVisible = ref(false)
const resetPasswordLoading = ref(false)
const resetPasswordFormRef = ref<FormInstance>()
const resetPasswordForm = reactive({
  userId: 0,
  newPassword: '',
  confirmPassword: ''
})

const resetPasswordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度为8-20位', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '密码必须包含大小写字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== resetPasswordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 分配角色相关
const assignRolesVisible = ref(false)
const assignRolesLoading = ref(false)
const assignRolesForm = reactive({
  userId: 0,
  roleIds: [] as number[]
})

// 页面初始化
onMounted(() => {
  loadUsers()
  loadRoles()
})

// 加载用户列表
async function loadUsers() {
  loading.value = true
  try {
    const params = {
      current: pagination.current,
      size: pagination.size,
      ...filterForm
    }

    // 过滤空值
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === '' || params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params]
      }
    })

    const response = await adminUserApi.getUserList(params)
    users.value = response.records
    pagination.total = response.total
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 加载角色列表
async function loadRoles() {
  try {
    roles.value = await adminUserApi.getRoleList()
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

// 搜索用户
function searchUsers() {
  pagination.current = 1
  loadUsers()
}

// 重置筛选
function resetFilter() {
  Object.assign(filterForm, {
    username: '',
    nickname: '',
    mobile: '',
    email: '',
    status: undefined,
    gender: undefined,
    roleId: undefined
  })
  pagination.current = 1
  loadUsers()
}

// 处理选择变化
function handleSelectionChange(selection: AdminUser[]) {
  selectedUsers.value = selection
}

// 处理创建
function handleCreate() {
  currentUser.value = null
  formVisible.value = true
}

// 处理编辑
function handleEdit(user: AdminUser) {
  currentUser.value = user
  formVisible.value = true
}

// 处理表单成功
function handleFormSuccess() {
  loadUsers()
}

// 处理重置密码
function handleResetPassword(user: AdminUser) {
  resetPasswordForm.userId = user.id
  resetPasswordForm.newPassword = ''
  resetPasswordForm.confirmPassword = ''
  resetPasswordVisible.value = true
}

// 确认重置密码
async function confirmResetPassword() {
  if (!resetPasswordFormRef.value) return

  try {
    await resetPasswordFormRef.value.validate()
    resetPasswordLoading.value = true

    await adminUserApi.resetPassword({
      userId: resetPasswordForm.userId,
      newPassword: resetPasswordForm.newPassword
    })

    ElMessage.success('密码重置成功')
    resetPasswordVisible.value = false
  } catch (error) {
    console.error('重置密码失败:', error)
    ElMessage.error('重置密码失败')
  } finally {
    resetPasswordLoading.value = false
  }
}

// 处理下拉菜单命令
async function handleDropdownCommand(command: string, user: AdminUser) {
  switch (command) {
    case 'lock':
      await handleLockUser(user)
      break
    case 'unlock':
      await handleUnlockUser(user)
      break
    case 'roles':
      handleAssignRoles(user)
      break
    case 'delete':
      await handleDeleteUser(user)
      break
  }
}

// 锁定用户
async function handleLockUser(user: AdminUser) {
  try {
    await ElMessageBox.confirm(`确定要锁定用户 "${user.username}" 吗？`, '确认锁定', {
      type: 'warning'
    })

    await adminUserApi.lockUser(user.id)
    ElMessage.success('锁定成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('锁定用户失败:', error)
      ElMessage.error('锁定用户失败')
    }
  }
}

// 解锁用户
async function handleUnlockUser(user: AdminUser) {
  try {
    await ElMessageBox.confirm(`确定要解锁用户 "${user.username}" 吗？`, '确认解锁', {
      type: 'warning'
    })

    await adminUserApi.unlockUser(user.id)
    ElMessage.success('解锁成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解锁用户失败:', error)
      ElMessage.error('解锁用户失败')
    }
  }
}

// 删除用户
async function handleDeleteUser(user: AdminUser) {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？`, '确认删除', {
      type: 'warning'
    })

    await adminUserApi.deleteUser(user.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error('删除用户失败')
    }
  }
}

// 分配角色
function handleAssignRoles(user: AdminUser) {
  assignRolesForm.userId = user.id
  assignRolesForm.roleIds = [...(user.roleIds || [])]
  assignRolesVisible.value = true
}

// 确认分配角色
async function confirmAssignRoles() {
  try {
    assignRolesLoading.value = true

    await adminUserApi.assignRoles({
      userId: assignRolesForm.userId,
      roleIds: assignRolesForm.roleIds
    })

    ElMessage.success('角色分配成功')
    assignRolesVisible.value = false
    loadUsers()
  } catch (error) {
    console.error('分配角色失败:', error)
    ElMessage.error('分配角色失败')
  } finally {
    assignRolesLoading.value = false
  }
}

// 批量删除
async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedUsers.value.length} 个用户吗？`, '确认批量删除', {
      type: 'warning'
    })

    const userIds = selectedUsers.value.map(user => user.id)
    await adminUserApi.batchDeleteUsers(userIds)
    ElMessage.success('批量删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 批量锁定
async function handleBatchLock() {
  try {
    await ElMessageBox.confirm(`确定要锁定选中的 ${selectedUsers.value.length} 个用户吗？`, '确认批量锁定', {
      type: 'warning'
    })

    const userIds = selectedUsers.value.map(user => user.id)
    await adminUserApi.batchLockUsers(userIds)
    ElMessage.success('批量锁定成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量锁定失败:', error)
      ElMessage.error('批量锁定失败')
    }
  }
}

// 批量解锁
async function handleBatchUnlock() {
  try {
    await ElMessageBox.confirm(`确定要解锁选中的 ${selectedUsers.value.length} 个用户吗？`, '确认批量解锁', {
      type: 'warning'
    })

    const userIds = selectedUsers.value.map(user => user.id)
    await adminUserApi.batchUnlockUsers(userIds)
    ElMessage.success('批量解锁成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量解锁失败:', error)
      ElMessage.error('批量解锁失败')
    }
  }
}

// 格式化时间
function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.batch-actions {
  background: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-info {
  color: #606266;
  margin-right: 10px;
}

.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.pagination-section {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.text-gray {
  color: #909399;
}
</style>
