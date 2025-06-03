<template>
  <div class="tag-management">
    <div class="page-header">
      <h2>评论标签管理</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        新增标签
      </el-button>
    </div>

    <!-- 标签列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="tags"
        stripe
        class="centered-table"
        style="text-align: center; width: 100%;"
        :table-layout="'fixed'"
      >
        <el-table-column
          prop="id"
          label="ID"
          min-width="60"
          align="center"
          header-align="center"
        >
          <template #header>
            <div style="text-align: center; width: 100%;">ID</div>
          </template>
          <template #default="{ row }">
            <div style="text-align: center; width: 100%;">{{ row.id }}</div>
          </template>
        </el-table-column>
        <el-table-column
          prop="name"
          label="标签名称"
          min-width="120"
          align="center"
          header-align="center"
        >
          <template #header>
            <div style="text-align: center; width: 100%;">标签名称</div>
          </template>
          <template #default="{ row }">
            <div style="text-align: center; width: 100%;">{{ row.name }}</div>
          </template>
        </el-table-column>
        <el-table-column
          label="标签类型"
          min-width="100"
          align="center"
          header-align="center"
        >
          <template #header>
            <div style="text-align: center; width: 100%;">标签类型</div>
          </template>
          <template #default="{ row }">
            <div style="text-align: center; width: 100%;">
              <el-tag
                :type="row.type === 1 ? 'success' : row.type === 2 ? 'danger' : 'info'"
                size="small"
              >
                {{ row.typeName }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="sortOrder"
          label="排序"
          min-width="80"
          align="center"
          header-align="center"
        >
          <template #header>
            <div style="text-align: center; width: 100%;">排序</div>
          </template>
          <template #default="{ row }">
            <div style="text-align: center; width: 100%;">{{ row.sortOrder }}</div>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          min-width="80"
          align="center"
          header-align="center"
        >
          <template #header>
            <div style="text-align: center; width: 100%;">状态</div>
          </template>
          <template #default="{ row }">
            <div style="text-align: center; width: 100%;">
              <el-switch
                v-model="row.status"
                :active-value="1"
                :inactive-value="0"
                @change="updateTagStatus(row)"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          min-width="160"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #header>
            <div style="text-align: center; width: 100%;">操作</div>
          </template>
          <template #default="{ row }">
            <div class="action-buttons" style="text-align: center; width: 100%;">
              <el-button type="primary" size="small" @click="editTag(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="deleteTag(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑标签对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑标签' : '新增标签'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择标签类型">
            <el-option label="正面" :value="1" />
            <el-option label="负面" :value="2" />
            <el-option label="中性" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :max="999"
            placeholder="排序值"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { reviewApi } from '../../api/review'
import type { ReviewTag } from '../../types/review'

const loading = ref(false)
const tags = ref<ReviewTag[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()

const formData = reactive({
  id: 0,
  name: '',
  type: 1,
  sortOrder: 0,
  status: 1
})

const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '标签名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择标签类型', trigger: 'change' }
  ],
  sortOrder: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
}

// 加载标签列表
const loadTags = async () => {
  loading.value = true
  try {
    tags.value = await reviewApi.getAllTags()
  } catch (error: any) {
    ElMessage.error(error.message || '加载标签列表失败')
  } finally {
    loading.value = false
  }
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑标签
const editTag = (tag: ReviewTag) => {
  isEdit.value = true
  Object.assign(formData, tag)
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: 0,
    name: '',
    type: 1,
    sortOrder: 0,
    status: 1
  })
  formRef.value?.resetFields()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await reviewApi.updateTag(formData.id, {
        name: formData.name,
        type: formData.type,
        sortOrder: formData.sortOrder,
        status: formData.status
      })
      ElMessage.success('更新标签成功')
    } else {
      await reviewApi.createTag({
        name: formData.name,
        type: formData.type,
        sortOrder: formData.sortOrder,
        status: formData.status
      })
      ElMessage.success('创建标签成功')
    }

    dialogVisible.value = false
    loadTags()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 更新标签状态
const updateTagStatus = async (tag: ReviewTag) => {
  try {
    await reviewApi.updateTag(tag.id, { status: tag.status })
    ElMessage.success('状态更新成功')
  } catch (error: any) {
    ElMessage.error(error.message || '状态更新失败')
    // 恢复原状态
    tag.status = tag.status === 1 ? 0 : 1
  }
}

// 删除标签
const deleteTag = async (tag: ReviewTag) => {
  try {
    await ElMessageBox.confirm(`确定要删除标签 "${tag.name}" 吗？`, '确认删除', {
      type: 'warning'
    })

    await reviewApi.deleteTag(tag.id)
    ElMessage.success('删除成功')
    loadTags()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadTags()
})
</script>

<style scoped>
.tag-management {
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
  color: #333;
}

/* 表格整体样式 */
.table-card {
  margin-bottom: 20px;
  overflow-x: auto;
}

.table-card .centered-table.el-table {
  border-radius: 6px;
  overflow: hidden;
  width: 100% !important;
  table-layout: fixed !important;
}

/* 最强力的表头居中样式 */
.table-card .centered-table.el-table .el-table__header-wrapper th.el-table__cell {
  text-align: center !important;
  padding: 12px 0 !important;
  background-color: #f8f9fa !important;
  font-weight: 600 !important;
  color: #303133 !important;
}

.table-card .centered-table.el-table .el-table__header-wrapper th.el-table__cell .cell {
  text-align: center !important;
  justify-content: center !important;
  width: 100% !important;
}

/* 最强力的表体居中样式 */
.table-card .centered-table.el-table .el-table__body-wrapper td.el-table__cell {
  text-align: center !important;
  padding: 12px 0 !important;
  vertical-align: middle !important;
}

.table-card .centered-table.el-table .el-table__body-wrapper td.el-table__cell .cell {
  text-align: center !important;
  justify-content: center !important;
  width: 100% !important;
}

/* 悬停效果 */
.table-card .centered-table.el-table .el-table__body tr.el-table__row:hover {
  background-color: #f5f7fa !important;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.action-buttons .el-button {
  margin: 0;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .table-card .centered-table.el-table {
    min-width: 600px;
  }
}

@media (min-width: 769px) {
  .table-card .centered-table.el-table {
    width: 100% !important;
  }
}

.dialog-footer {
  text-align: right;
}
</style>
