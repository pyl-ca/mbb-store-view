<template>
  <div class="order-management">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
        <el-button @click="loadOrders" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="订单状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户搜索">
          <el-input v-model="filterForm.userKeyword" placeholder="请输入用户名或手机号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="filterForm.orderSn" placeholder="请输入订单号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchOrders">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 订单列表 -->
    <div class="table-section">
      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="orderSn" label="订单号" width="180" />
        <el-table-column prop="userName" label="收货人" width="120" />
        <el-table-column prop="userPhone" label="联系电话" width="130" />
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="实付金额" width="120">
          <template #default="{ row }">
            ¥{{ row.payAmount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="payTypeName" label="支付方式" width="100" />
        <el-table-column prop="statusName" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sourceType" label="订单来源" width="100">
          <template #default="{ row }">
            <el-tag :type="row.sourceType === 0 ? 'primary' : 'success'">
              {{ row.sourceType === 0 ? '直接购买' : '购物车' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="payTime" label="支付时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.payTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrderDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadOrders"
          @current-change="loadOrders"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

// 数据定义
const loading = ref(false)
const orders = ref<any[]>([])

// 筛选表单
const filterForm = reactive({
  status: null as number | null,
  orderSn: '',
  userKeyword: '',
  startTime: '',
  endTime: ''
})

// 日期范围
const dateRange = ref<[string, string] | null>(null)

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 页面初始化
onMounted(() => {
  loadOrders()
})

// 加载订单列表
async function loadOrders() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }

    // 添加筛选条件
    if (filterForm.status !== null && filterForm.status !== undefined) params.status = filterForm.status
    if (filterForm.orderSn && filterForm.orderSn.trim()) params.orderSn = filterForm.orderSn.trim()
    if (filterForm.userKeyword && filterForm.userKeyword.trim()) params.userKeyword = filterForm.userKeyword.trim()
    if (filterForm.startTime) params.startTime = filterForm.startTime
    if (filterForm.endTime) params.endTime = filterForm.endTime

    console.log('订单管理-发送的查询参数:', params)

    const response = await axios.get('http://localhost:9999/order-service/api/v1/orders/admin/all', {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    console.log('订单管理-API响应:', response.data)

    // 检查响应结构
    if (response.data && response.data.code === '000000') {
      const data = response.data.data
      console.log('订单管理-成功响应的data:', data)

      if (data && data.records && Array.isArray(data.records)) {
        orders.value = data.records
        pagination.total = data.total || 0
        console.log('订单管理-使用分页结构，records数量:', data.records.length)
      } else if (data && Array.isArray(data)) {
        orders.value = data
        pagination.total = data.length
        console.log('订单管理-使用数组结构，数量:', data.length)
      } else {
        orders.value = []
        pagination.total = 0
        console.log('订单管理-未找到有效数据结构')
      }
    } else {
      orders.value = []
      pagination.total = 0
      console.log('订单管理-API响应失败:', response.data)
    }

    console.log('订单管理-最终orders数量:', orders.value.length)
    console.log('订单管理-最终total:', pagination.total)
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

// 搜索订单
function searchOrders() {
  pagination.page = 1
  loadOrders()
}

// 重置筛选
function resetFilter() {
  filterForm.status = null
  filterForm.orderSn = ''
  filterForm.userKeyword = ''
  filterForm.startTime = ''
  filterForm.endTime = ''
  dateRange.value = null
  pagination.page = 1
  loadOrders()
}

// 处理日期范围变化
function handleDateChange(dates: [string, string] | null) {
  if (dates && dates.length === 2) {
    filterForm.startTime = dates[0]
    filterForm.endTime = dates[1]
  } else {
    filterForm.startTime = ''
    filterForm.endTime = ''
  }
}

// 查看订单详情
function viewOrderDetail(order: any) {
  // 在新窗口打开订单详情页面，添加from=admin参数
  const url = `/order-detail/${order.orderSn}?from=admin`
  window.open(url, '_blank')
}

// 获取订单状态类型
function getStatusType(status: number) {
  const types = {
    0: 'warning',  // 待支付
    1: 'success',  // 已支付
    2: 'primary',  // 已发货
    3: 'success',  // 已完成
    4: 'danger'    // 已取消
  }
  return types[status as keyof typeof types] || 'info'
}

// 格式化时间
function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.order-management {
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
