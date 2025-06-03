<template>
  <div class="category-management">
    <div class="page-header">
      <h2>商品分类管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
        <el-button @click="loadCategories" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="selectedCategories.length === 0"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 分类树 -->
    <div class="table-section">
      <el-table
        :data="categories"
        v-loading="loading"
        stripe
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        @selection-change="handleSelectionChange"
        :header-cell-style="{
          background: '#f5f7fa',
          color: '#606266',
          fontWeight: 'bold',
          textAlign: 'center'
        }"
        border
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="分类图标" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.icon"
              :src="getCategoryIcon(row.icon)"
              style="width: 40px; height: 40px"
              fit="cover"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="分类名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="level" label="层级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isShow" label="显示状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isShow ? 'success' : 'danger'" size="small">
              {{ row.isShow ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button
                size="small"
                @click="handleViewPath(row)"
                type="info"
              >
                路径
              </el-button>
              <el-dropdown @command="(command) => handleShowStatusCommand(command, row)">
                <el-button
                  size="small"
                  :type="row.isShow ? 'warning' : 'success'"
                >
                  {{ row.isShow ? '隐藏' : '显示' }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'toggle', cascade: false }">
                      {{ row.isShow ? '隐藏' : '显示' }}（仅当前）
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'toggle', cascade: true }" v-if="hasChildren(row)">
                      {{ row.isShow ? '隐藏' : '显示' }}（级联子分类）
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分类表单对话框 -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>

        <el-form-item label="父级分类" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="categoryOptions"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择父级分类（不选则为顶级分类）"
            clearable
            check-strictly
          />
        </el-form-item>

        <el-form-item label="分类图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标URL或路径" />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>

        <el-form-item label="显示状态" prop="isShow">
          <el-radio-group v-model="form.isShow">
            <el-radio :label="true">显示</el-radio>
            <el-radio :label="false">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.parentId" label="预计层级">
          <el-tag :type="getPreviewLevelType()">
            {{ getPreviewLevelText() }}
          </el-tag>
          <span v-if="getPreviewLevel() > 5" class="level-warning">
            ⚠️ 超过最大层级限制（5级）
          </span>
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

    <!-- 分类路径对话框 -->
    <el-dialog
      v-model="pathVisible"
      title="分类路径"
      width="600px"
    >
      <div class="category-path">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item
            v-for="(item, index) in categoryPath"
            :key="item.id"
            :class="{ 'current-category': index === categoryPath.length - 1 }"
          >
            <el-tag :type="getLevelType(item.level)" size="small">
              {{ item.level }}级
            </el-tag>
            {{ item.name }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="path-info" v-if="categoryPath.length > 0">
        <p><strong>当前层级：</strong>{{ categoryPath[categoryPath.length - 1]?.level }}级</p>
        <p><strong>路径深度：</strong>{{ categoryPath.length }}层</p>
        <p><strong>完整路径：</strong>{{ categoryPath.map(item => item.name).join(' → ') }}</p>
      </div>

      <template #footer>
        <el-button @click="pathVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Refresh, Delete, ArrowDown } from '@element-plus/icons-vue'
import axios from 'axios'

// 数据定义
const loading = ref(false)
const categories = ref<any[]>([])
const selectedCategories = ref<any[]>([])
const formVisible = ref(false)
const pathVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const categoryPath = ref<any[]>([])

// 表单数据
const form = reactive({
  id: undefined as number | undefined,
  name: '',
  parentId: undefined as number | undefined,
  icon: '',
  sort: 0,
  isShow: true
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '分类名称长度为2-50个字符', trigger: 'blur' }
  ],
  parentId: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value && getPreviewLevel() > 5) {
          callback(new Error('分类层级不能超过5级'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 计算属性
const isEdit = computed(() => !!form.id)

// 分类选项（用于父级分类选择）
const categoryOptions = computed(() => {
  const buildOptions = (items: any[], level = 0): any[] => {
    return items.map(item => ({
      id: item.id,
      name: '　'.repeat(level) + item.name,
      children: item.children ? buildOptions(item.children, level + 1) : undefined
    }))
  }
  return buildOptions(categories.value)
})

// 页面初始化
onMounted(() => {
  loadCategories()
})

// 加载分类列表
async function loadCategories() {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:9999/product-service/api/v1/admin/categories/tree', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    if (response.data.code === '000000') {
      categories.value = response.data.data || []
    }
  } catch (error) {
    console.error('加载分类列表失败:', error)
    ElMessage.error('加载分类列表失败')
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
function handleEdit(category: any) {
  Object.assign(form, {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    icon: category.icon || '',
    sort: category.sort || 0,
    isShow: category.isShow
  })
  formVisible.value = true
}

// 重置表单
function resetForm() {
  Object.assign(form, {
    id: undefined,
    name: '',
    parentId: undefined,
    icon: '',
    sort: 0,
    isShow: true
  })
}

// 处理提交
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    const url = isEdit.value
      ? `http://localhost:9999/product-service/api/v1/admin/categories/${form.id}`
      : 'http://localhost:9999/product-service/api/v1/admin/categories'
    
    const method = isEdit.value ? 'put' : 'post'
    
    await axios[method](url, form, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    formVisible.value = false
    loadCategories()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 处理显示状态命令
async function handleShowStatusCommand(command: { action: string, cascade: boolean }, category: any) {
  if (command.action === 'toggle') {
    await toggleShowStatus(category, command.cascade)
  }
}

// 检查是否有子分类
function hasChildren(category: any): boolean {
  return category.children && category.children.length > 0
}

// 切换显示状态（支持级联操作）
async function toggleShowStatus(category: any, cascade: boolean = false) {
  try {
    const action = category.isShow ? '隐藏' : '显示'
    const cascadeText = cascade ? '（级联子分类）' : '（仅当前）'

    let confirmMessage = `确定要${action}分类 "${category.name}" 吗？${cascadeText}`

    if (cascade && hasChildren(category)) {
      const childCount = countAllChildren(category)
      confirmMessage = `此操作将${action}分类 "${category.name}" 及其所有 ${childCount} 个子分类，确定继续吗？`
    }

    await ElMessageBox.confirm(confirmMessage, `确认${action}`, {
      type: 'warning',
      dangerouslyUseHTMLString: false
    })

    const url = `http://localhost:9999/product-service/api/v1/admin/categories/${category.id}/show?isShow=${!category.isShow}${cascade ? '&cascade=true' : ''}`

    await axios.put(url, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    const successMessage = cascade ? `${action}成功（级联操作）` : `${action}成功`
    ElMessage.success(successMessage)
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换显示状态失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 递归计算所有子分类数量
function countAllChildren(category: any): number {
  if (!category.children || category.children.length === 0) {
    return 0
  }

  let count = category.children.length
  for (const child of category.children) {
    count += countAllChildren(child)
  }
  return count
}

// 删除分类
async function handleDelete(category: any) {
  try {
    await ElMessageBox.confirm(`确定要删除分类 "${category.name}" 吗？`, '确认删除', {
      type: 'warning'
    })

    await axios.delete(`http://localhost:9999/product-service/api/v1/admin/categories/${category.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 获取分类图标
function getCategoryIcon(icon: string) {
  if (!icon) return ''
  if (icon.startsWith('http')) return icon
  return `http://localhost:9999/static${icon}`
}

// 获取层级类型
function getLevelType(level: number) {
  const types = ['primary', 'success', 'warning']
  return types[level - 1] || 'info'
}

// 获取层级文本
function getLevelText(level: number) {
  const texts = ['一级', '二级', '三级', '四级', '五级']
  return texts[level - 1] || `${level}级`
}

// 格式化时间
function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 处理选择变化
function handleSelectionChange(selection: any[]) {
  selectedCategories.value = selection
}

// 获取预计层级
function getPreviewLevel(): number {
  if (!form.parentId) return 1
  const parent = findCategoryById(form.parentId)
  return parent ? parent.level + 1 : 1
}

// 获取预计层级类型
function getPreviewLevelType(): string {
  const level = getPreviewLevel()
  if (level > 5) return 'danger'
  return getLevelType(level)
}

// 获取预计层级文本
function getPreviewLevelText(): string {
  const level = getPreviewLevel()
  if (level > 5) return `${level}级 (超出限制)`
  return getLevelText(level)
}

// 根据ID查找分类
function findCategoryById(id: number): any {
  function findInTree(items: any[]): any {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children) {
        const found = findInTree(item.children)
        if (found) return found
      }
    }
    return null
  }
  return findInTree(categories.value)
}

// 查看分类路径
async function handleViewPath(category: any) {
  try {
    const response = await axios.get(`http://localhost:9999/product-service/api/v1/admin/categories/${category.id}/path`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    if (response.data.code === '000000') {
      categoryPath.value = response.data.data || []
      pathVisible.value = true
    }
  } catch (error) {
    console.error('获取分类路径失败:', error)
    ElMessage.error('获取分类路径失败')
  }
}

// 批量删除
async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedCategories.value.length} 个分类吗？`, '确认批量删除', {
      type: 'warning'
    })

    const ids = selectedCategories.value.map(item => item.id)
    await axios.delete('http://localhost:9999/product-service/api/v1/admin/categories/batch', {
      data: { ids },
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success('批量删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}
</script>

<style scoped>
.category-management {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 20px;
}

.table-section :deep(.el-table) {
  border-radius: 6px;
  overflow: hidden;
}

.table-section :deep(.el-table th) {
  padding: 12px 0;
}

.table-section :deep(.el-table td) {
  padding: 10px 0;
}

.table-section :deep(.el-table .el-table__row) {
  transition: background-color 0.2s;
}

.table-section :deep(.el-table .el-table__row:hover) {
  background-color: #f5f7fa;
}

.level-warning {
  color: #f56c6c;
  font-size: 12px;
  margin-left: 10px;
}

.category-path {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 20px;
}

.current-category {
  font-weight: bold;
  color: #409eff;
}

.path-info {
  padding: 15px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.path-info p {
  margin: 8px 0;
  line-height: 1.6;
}

.path-info strong {
  color: #303133;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.action-buttons .el-button {
  margin: 0;
  padding: 5px 8px;
  font-size: 12px;
}

/* 下拉菜单样式 */
.action-buttons :deep(.el-dropdown) {
  display: inline-block;
}

.action-buttons :deep(.el-dropdown .el-button) {
  margin: 0;
  padding: 5px 8px;
  font-size: 12px;
}

.action-buttons :deep(.el-dropdown-menu__item) {
  font-size: 12px;
  padding: 8px 16px;
}

.action-buttons :deep(.el-dropdown-menu__item:hover) {
  background-color: #f5f7fa;
  color: #409eff;
}
</style>
