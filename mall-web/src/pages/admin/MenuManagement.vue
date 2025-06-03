<template>
  <div class="menu-management">
    <div class="page-header">
      <h2>菜单管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增菜单
        </el-button>
        <el-button @click="loadMenus" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 菜单树 -->
    <div class="table-section">
      <el-table 
        :data="menus" 
        v-loading="loading" 
        stripe
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="菜单名称" width="200" />
        <el-table-column prop="path" label="路由路径" width="150" />
        <el-table-column prop="component" label="组件路径" width="180" />
        <el-table-column prop="icon" label="图标" width="80">
          <template #default="{ row }">
            <el-icon v-if="row.icon">
              <component :is="row.icon" />
            </el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="visible" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.visible === 1 ? 'success' : 'danger'">
              {{ row.visible === 1 ? '显示' : '隐藏' }}
            </el-tag>
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
            <el-button 
              size="small" 
              :type="row.visible === 1 ? 'warning' : 'success'"
              @click="toggleVisible(row)"
            >
              {{ row.visible === 1 ? '隐藏' : '显示' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 菜单表单对话框 -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>

        <el-form-item label="父级菜单" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择父级菜单（不选则为顶级菜单）"
            clearable
            check-strictly
          />
        </el-form-item>

        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="请输入路由路径" />
        </el-form-item>

        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="请输入组件路径" />
        </el-form-item>

        <el-form-item label="菜单图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标名称" />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>

        <el-form-item label="状态" prop="visible">
          <el-radio-group v-model="form.visible">
            <el-radio :label="1">显示</el-radio>
            <el-radio :label="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="跳转路径" prop="redirect">
          <el-input v-model="form.redirect" placeholder="请输入跳转路径（可选）" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { adminUserApi } from '../../api/admin-user'
import type { Menu } from '../../types/admin-user'

// 数据定义
const loading = ref(false)
const menus = ref<Menu[]>([])
const formVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive({
  id: undefined as number | undefined,
  name: '',
  parentId: undefined as number | undefined,
  path: '',
  component: '',
  icon: '',
  sort: 0,
  visible: 1,
  redirect: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 50, message: '菜单名称长度为2-50个字符', trigger: 'blur' }
  ]
}

// 计算属性
const isEdit = computed(() => !!form.id)

// 菜单选项（用于父级菜单选择）
const menuOptions = computed(() => {
  const buildOptions = (items: Menu[], level = 0): any[] => {
    return items.map(item => ({
      id: item.id,
      name: '　'.repeat(level) + item.name,
      children: item.children ? buildOptions(item.children, level + 1) : undefined
    }))
  }
  return buildOptions(menus.value)
})

// 页面初始化
onMounted(() => {
  loadMenus()
})

// 加载菜单列表
async function loadMenus() {
  loading.value = true
  try {
    menus.value = await adminUserApi.getMenuTree()
  } catch (error) {
    console.error('加载菜单列表失败:', error)
    ElMessage.error('加载菜单列表失败')
  } finally {
    loading.value = false
  }
}

// 处理创建
function handleCreate() {
  resetForm()
  formVisible.value = true
}

// 处理编辑
function handleEdit(menu: Menu) {
  Object.assign(form, {
    id: menu.id,
    name: menu.name,
    parentId: menu.parentId,
    path: menu.path || '',
    component: menu.component || '',
    icon: menu.icon || '',
    sort: menu.sort || 0,
    visible: menu.visible,
    redirect: menu.redirect || ''
  })
  formVisible.value = true
}

// 重置表单
function resetForm() {
  Object.assign(form, {
    id: undefined,
    name: '',
    parentId: undefined,
    path: '',
    component: '',
    icon: '',
    sort: 0,
    visible: 1,
    redirect: ''
  })
}

// 处理提交
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (isEdit.value) {
      await adminUserApi.updateMenu({
        id: form.id!,
        name: form.name,
        parentId: form.parentId,
        path: form.path,
        component: form.component,
        icon: form.icon,
        sort: form.sort,
        visible: form.visible,
        redirect: form.redirect
      })
    } else {
      await adminUserApi.createMenu({
        name: form.name,
        parentId: form.parentId,
        path: form.path,
        component: form.component,
        icon: form.icon,
        sort: form.sort,
        visible: form.visible,
        redirect: form.redirect
      })
    }

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    formVisible.value = false
    loadMenus()
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 切换菜单显示状态
async function toggleVisible(menu: Menu) {
  try {
    const action = menu.visible === 1 ? '隐藏' : '显示'
    await ElMessageBox.confirm(`确定要${action}菜单 "${menu.name}" 吗？`, `确认${action}`, {
      type: 'warning'
    })

    if (menu.visible === 1) {
      await adminUserApi.disableMenu(menu.id)
    } else {
      await adminUserApi.enableMenu(menu.id)
    }

    ElMessage.success(`${action}成功`)
    loadMenus()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换菜单状态失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 删除菜单
async function handleDelete(menu: Menu) {
  try {
    await ElMessageBox.confirm(`确定要删除菜单 "${menu.name}" 吗？`, '确认删除', {
      type: 'warning'
    })

    await adminUserApi.deleteMenu(menu.id)
    ElMessage.success('删除成功')
    loadMenus()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除菜单失败:', error)
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
.menu-management {
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
</style>
