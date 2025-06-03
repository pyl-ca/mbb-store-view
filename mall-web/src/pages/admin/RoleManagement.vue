<template>
  <div class="role-management">
    <div class="page-header">
      <h2>角色管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增角色
        </el-button>
        <el-button @click="loadRoles" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 角色列表 -->
    <div class="table-section">
      <el-table :data="roles" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="code" label="角色编码" width="150" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userCount" label="用户数量" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="info" @click="handlePermissions(row)">权限</el-button>
            <el-button
              size="small"
              :type="row.status === 0 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 0 ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="角色编码" prop="code">
          <el-input
            v-model="form.code"
            placeholder="请输入角色编码（大写字母和下划线）"
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="0">正常</el-radio>
            <el-radio :label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="菜单权限" prop="menuIds">
          <el-tree
            ref="menuTreeRef"
            :data="menuTree"
            :props="{ children: 'children', label: 'name' }"
            node-key="id"
            show-checkbox
            check-strictly
            style="max-height: 300px; overflow-y: auto; border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px;"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限分配对话框 -->
    <el-dialog v-model="permissionVisible" title="分配权限" width="800px">
      <div v-if="currentRole">
        <h4>角色：{{ currentRole.name }}</h4>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="菜单权限" name="menus">
            <el-tree
              ref="permissionMenuTreeRef"
              :data="menuTree"
              :props="{ children: 'children', label: 'name' }"
              node-key="id"
              show-checkbox
              check-strictly
              style="max-height: 400px; overflow-y: auto;"
            />
          </el-tab-pane>
          <el-tab-pane label="操作权限" name="permissions">
            <div class="permission-list">
              <el-checkbox-group v-model="selectedPermissions">
                <div v-for="permission in permissions" :key="permission.id" class="permission-item">
                  <el-checkbox :label="permission.id">{{ permission.name }}</el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="permissionVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions" :loading="permissionLoading">
          保存权限
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { adminUserApi } from '../../api/admin-user'
import type { Role, Menu } from '../../types/admin-user'

// 数据定义
const loading = ref(false)
const roles = ref<Role[]>([])
const menuTree = ref<Menu[]>([])
const permissions = ref<any[]>([])
const formVisible = ref(false)
const permissionVisible = ref(false)
const submitLoading = ref(false)
const permissionLoading = ref(false)
const formRef = ref<FormInstance>()
const menuTreeRef = ref()
const permissionMenuTreeRef = ref()
const activeTab = ref('menus')
const currentRole = ref<Role | null>(null)
const selectedPermissions = ref<number[]>([])

// 表单数据
const form = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  sort: 0,
  status: 0,
  menuIds: [] as number[]
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度为2-50个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { min: 2, max: 32, message: '角色编码长度为2-32个字符', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '角色编码只能包含大写字母、数字和下划线', trigger: 'blur' }
  ]
}

// 计算属性
const isEdit = computed(() => !!form.id)

// 页面初始化
onMounted(() => {
  loadRoles()
  loadMenuTree()
  loadPermissions()
})

// 加载角色列表
async function loadRoles() {
  loading.value = true
  try {
    roles.value = await adminUserApi.getRoleList()
  } catch (error) {
    console.error('加载角色列表失败:', error)
    ElMessage.error('加载角色列表失败')
  } finally {
    loading.value = false
  }
}

// 加载菜单树
async function loadMenuTree() {
  try {
    menuTree.value = await adminUserApi.getMenuTree()
  } catch (error) {
    console.error('加载菜单树失败:', error)
  }
}

// 加载权限列表
async function loadPermissions() {
  try {
    // 这里应该调用权限API，暂时使用模拟数据
    permissions.value = [
      { id: 1, name: '用户查询' },
      { id: 2, name: '用户创建' },
      { id: 3, name: '用户编辑' },
      { id: 4, name: '用户删除' },
      { id: 5, name: '角色查询' },
      { id: 6, name: '角色创建' },
      { id: 7, name: '角色编辑' },
      { id: 8, name: '角色删除' }
    ]
  } catch (error) {
    console.error('加载权限列表失败:', error)
  }
}

// 处理创建
function handleCreate() {
  resetForm()
  formVisible.value = true
}

// 处理编辑
async function handleEdit(role: Role) {
  Object.assign(form, {
    id: role.id,
    name: role.name,
    code: role.code,
    sort: role.sort || 0,
    status: role.status,
    menuIds: role.menuIds || []
  })

  formVisible.value = true

  // 设置菜单树选中状态
  await nextTick()
  if (menuTreeRef.value && role.menuIds) {
    menuTreeRef.value.setCheckedKeys(role.menuIds)
  }
}

// 重置表单
function resetForm() {
  Object.assign(form, {
    id: undefined,
    name: '',
    code: '',
    sort: 0,
    status: 0,
    menuIds: []
  })

  // 清空菜单树选中状态
  nextTick(() => {
    if (menuTreeRef.value) {
      menuTreeRef.value.setCheckedKeys([])
    }
  })
}

// 处理提交
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    // 获取选中的菜单ID
    const checkedMenuIds = menuTreeRef.value?.getCheckedKeys() || []
    form.menuIds = checkedMenuIds

    if (isEdit.value) {
      await adminUserApi.updateRole({
        id: form.id!,
        name: form.name,
        code: form.code,
        sort: form.sort,
        status: form.status,
        menuIds: form.menuIds
      })
    } else {
      await adminUserApi.createRole({
        name: form.name,
        code: form.code,
        sort: form.sort,
        status: form.status,
        menuIds: form.menuIds
      })
    }

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    formVisible.value = false
    loadRoles()
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 处理权限分配
async function handlePermissions(role: Role) {
  currentRole.value = role
  activeTab.value = 'menus'

  try {
    // 加载角色的菜单权限
    const roleMenuIds = await adminUserApi.getRoleMenus(role.id)
    // 加载角色的操作权限
    const rolePermissionIds = await adminUserApi.getRolePermissions(role.id)

    selectedPermissions.value = rolePermissionIds

    await nextTick()
    if (permissionMenuTreeRef.value) {
      permissionMenuTreeRef.value.setCheckedKeys(roleMenuIds)
    }
  } catch (error) {
    console.error('加载角色权限失败:', error)
  }

  permissionVisible.value = true
}

// 保存权限
async function savePermissions() {
  if (!currentRole.value) return

  try {
    permissionLoading.value = true

    // 保存菜单权限
    const checkedMenuIds = permissionMenuTreeRef.value?.getCheckedKeys() || []
    await adminUserApi.assignRoleMenus(currentRole.value.id, checkedMenuIds)

    // 保存操作权限
    await adminUserApi.assignRolePermissions(currentRole.value.id, selectedPermissions.value)

    ElMessage.success('权限保存成功')
    permissionVisible.value = false
    loadRoles()
  } catch (error: any) {
    console.error('保存权限失败:', error)
    ElMessage.error(error.message || '保存权限失败')
  } finally {
    permissionLoading.value = false
  }
}

// 切换角色状态
async function toggleStatus(role: Role) {
  try {
    const action = role.status === 0 ? '停用' : '启用'
    await ElMessageBox.confirm(`确定要${action}角色 "${role.name}" 吗？`, `确认${action}`, {
      type: 'warning'
    })

    if (role.status === 0) {
      await adminUserApi.disableRole(role.id)
    } else {
      await adminUserApi.enableRole(role.id)
    }

    ElMessage.success(`${action}成功`)
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换角色状态失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 删除角色
async function handleDelete(role: Role) {
  try {
    await ElMessageBox.confirm(`确定要删除角色 "${role.name}" 吗？`, '确认删除', {
      type: 'warning'
    })

    await adminUserApi.deleteRole(role.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除角色失败:', error)
      ElMessage.error('删除失败')
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
.role-management {
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

.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.permission-list {
  max-height: 400px;
  overflow-y: auto;
}

.permission-item {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}
</style>
