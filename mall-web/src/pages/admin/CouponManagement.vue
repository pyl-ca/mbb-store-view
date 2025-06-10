<template>
  <div class="coupon-management">
    <div class="page-header">
      <h2>优惠券管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增优惠券
        </el-button>
        <el-button @click="loadCoupons" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="优惠券名称">
          <el-input v-model="filterForm.name" placeholder="请输入优惠券名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="优惠券类型">
          <el-select v-model="filterForm.type" placeholder="请选择类型" clearable style="width: 120px">
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
            <el-option label="现金券" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="未开始" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="已结束" :value="2" />
            <el-option label="已停用" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchCoupons">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 优惠券列表 -->
    <div class="table-section">
      <el-table :data="coupons" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="优惠券名称" width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="优惠金额/折扣" width="120">
          <template #default="{ row }">
            {{ row.type === 2 ? `${row.value}折` : `¥${row.value}` }}
          </template>
        </el-table-column>
        <el-table-column prop="minAmount" label="使用门槛" width="100">
          <template #default="{ row }">
            {{ row.minAmount ? `满¥${row.minAmount}` : '无门槛' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalCount" label="发放数量" width="100" />
        <el-table-column prop="usedCount" label="已使用" width="100" />
        <el-table-column prop="startTime" label="开始时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 3 ? 'success' : 'warning'"
              @click="toggleStatus(row)"
              :disabled="row.status === 2"
            >
              {{ row.status === 3 ? '启用' : '停用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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
          @size-change="loadCoupons"
          @current-change="loadCoupons"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

// 数据定义
const loading = ref(false)
const coupons = ref<any[]>([])

// 筛选表单
const filterForm = reactive({
  name: '',
  type: undefined as number | undefined,
  status: undefined as number | undefined
})

// 分页
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 页面初始化
onMounted(() => {
  loadCoupons()
})

// 加载优惠券列表
async function loadCoupons() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.current,
      size: pagination.size
    }

    // 添加筛选条件
    if (filterForm.name) params.name = filterForm.name
    if (filterForm.type !== undefined) params.type = filterForm.type
    if (filterForm.status !== undefined) params.status = filterForm.status

    const response = await axios.get('/marketing-service/api/v1/coupons/admin/list', {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    if (response.data.code === '000000') {
      const data = response.data.data
      coupons.value = data.records || data || []
      pagination.total = data.total || coupons.value.length
    }
  } catch (error) {
    console.error('加载优惠券列表失败:', error)
    ElMessage.error('加载优惠券列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索优惠券
function searchCoupons() {
  pagination.current = 1
  loadCoupons()
}

// 重置筛选
function resetFilter() {
  filterForm.name = ''
  filterForm.type = undefined
  filterForm.status = undefined
  pagination.current = 1
  loadCoupons()
}

// 处理创建
function handleCreate() {
  ElMessage.info('优惠券创建功能开发中')
}

// 处理编辑
function handleEdit(coupon: any) {
  ElMessage.info('优惠券编辑功能开发中')
}

// 切换优惠券状态
async function toggleStatus(coupon: any) {
  try {
    const action = coupon.status === 3 ? '启用' : '停用'
    await ElMessageBox.confirm(`确定要${action}优惠券 "${coupon.name}" 吗？`, `确认${action}`, {
      type: 'warning'
    })

    const newStatus = coupon.status === 3 ? 1 : 3
    await axios.put(`/marketing-service/api/v1/coupons/${coupon.id}/status`, 
      { status: newStatus },
      { headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` } }
    )

    ElMessage.success(`${action}成功`)
    loadCoupons()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换优惠券状态失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 删除优惠券
async function handleDelete(coupon: any) {
  try {
    await ElMessageBox.confirm(`确定要删除优惠券 "${coupon.name}" 吗？`, '确认删除', {
      type: 'warning'
    })

    await axios.delete(`/marketing-service/api/v1/coupons/${coupon.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success('删除成功')
    loadCoupons()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除优惠券失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 获取类型颜色
function getTypeColor(type: number) {
  const colors = { 1: 'primary', 2: 'success', 3: 'warning' }
  return colors[type as keyof typeof colors] || 'info'
}

// 获取类型文本
function getTypeText(type: number) {
  const texts = { 1: '满减券', 2: '折扣券', 3: '现金券' }
  return texts[type as keyof typeof texts] || '未知'
}

// 获取状态颜色
function getStatusColor(status: number) {
  const colors = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return colors[status as keyof typeof colors] || 'info'
}

// 获取状态文本
function getStatusText(status: number) {
  const texts = { 0: '未开始', 1: '进行中', 2: '已结束', 3: '已停用' }
  return texts[status as keyof typeof texts] || '未知'
}

// 格式化时间
function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.coupon-management {
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
</style>
