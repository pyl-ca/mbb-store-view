<template>
  <div class="delivery-management">
    <div class="page-header">
      <h2>发货管理</h2>
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
          <el-select
            v-model="filterForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="已支付" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
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
          <el-button type="success" @click="loadPendingDeliveryOrders">待发货订单</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 订单列表 -->
    <div class="table-section">
      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="orderSn" label="订单号" width="180" />
        <el-table-column label="收货人" width="120">
          <template #default="{ row }">
            {{ getRecipientName(row) }}
          </template>
        </el-table-column>
        <el-table-column label="联系电话" width="130">
          <template #default="{ row }">
            {{ getRecipientPhone(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="statusName" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.statusName }}</el-tag>
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              type="primary"
              size="small"
              @click="openDeliveryDialog(row)"
            >
              发货
            </el-button>
            <el-button
              v-if="row.status >= 2"
              size="small"
              @click="viewDeliveryInfo(row)"
            >
              查看物流
            </el-button>
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

    <!-- 发货弹窗 -->
    <el-dialog v-model="deliveryDialog.visible" title="创建发货单" width="600px">
      <el-form :model="deliveryForm" :rules="deliveryRules" ref="deliveryFormRef" label-width="100px">
        <el-form-item label="订单信息">
          <div class="order-info">
            <p><strong>订单号：</strong>{{ deliveryDialog.order?.orderSn }}</p>
            <p><strong>收货人：</strong>{{ deliveryDialog.order?.userName }}</p>
            <p><strong>收货地址：</strong>{{ getFullAddress(deliveryDialog.order) }}</p>
          </div>
        </el-form-item>

        <el-form-item label="快递公司" prop="expressCode">
          <el-select v-model="deliveryForm.expressCode" placeholder="请选择快递公司" style="width: 100%">
            <el-option
              v-for="company in expressCompanies"
              :key="company.code"
              :label="company.name"
              :value="company.code"
              @click="deliveryForm.expressCompany = company.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="快递单号" prop="trackingNumber">
          <el-input v-model="deliveryForm.trackingNumber" placeholder="请输入快递单号" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="deliveryForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="deliveryDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitDelivery" :loading="submitting">确认发货</el-button>
      </template>
    </el-dialog>

    <!-- 物流信息弹窗 -->
    <el-dialog v-model="trackingDialog.visible" title="物流信息" width="700px">
      <div v-if="trackingInfo" class="tracking-info">
        <div class="delivery-header">
          <h3>{{ trackingInfo.expressCompany }} - {{ trackingInfo.trackingNumber }}</h3>
          <el-tag :type="getDeliveryStatusType(trackingInfo.status)">
            {{ trackingInfo.statusName }}
          </el-tag>
        </div>

        <div class="tracking-timeline">
          <el-timeline>
            <el-timeline-item
              v-for="track in trackingInfo.trackList"
              :key="track.id"
              :timestamp="track.trackTime"
              placement="top"
            >
              <div class="track-content">
                <div class="track-status">{{ track.trackStatus || track.trackContent }}</div>
                <div class="track-info">{{ track.trackInfo || track.trackContent }}</div>
                <div class="track-location" v-if="track.location">{{ track.location }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

// 数据定义
interface ExpressCompany {
  code: string
  name: string
}

interface OrderInfo {
  orderSn: string
  userName: string
  province: string
  city: string
  district: string
  address: string
}

interface TrackingInfo {
  expressCompany: string
  trackingNumber: string
  status: number
  statusName: string
  trackList: Array<{
    id: number
    trackTime: string
    trackContent: string
    trackStatus?: string
    trackInfo?: string
    location?: string
  }>
}

const loading = ref(false)
const submitting = ref(false)
const orders = ref<any[]>([])
const expressCompanies = ref<ExpressCompany[]>([])
const trackingInfo = ref<TrackingInfo | null>(null)

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

// 发货弹窗
const deliveryDialog = reactive({
  visible: false,
  order: null as OrderInfo | null
})

const deliveryForm = reactive({
  orderSn: '',
  expressCode: '',
  expressCompany: '',
  trackingNumber: '',
  remark: '',
  operator: 'admin'
})

const deliveryFormRef = ref()

const deliveryRules = {
  expressCode: [
    { required: true, message: '请选择快递公司', trigger: 'change' }
  ],
  trackingNumber: [
    { required: true, message: '请输入快递单号', trigger: 'blur' }
  ]
}

// 物流信息弹窗
const trackingDialog = reactive({
  visible: false
})

// 页面初始化
onMounted(() => {
  // 检查URL参数中是否有订单号
  const urlParams = new URLSearchParams(window.location.search)
  const orderSnParam = urlParams.get('orderSn')

  if (orderSnParam) {
    // 如果有订单号参数，自动填入搜索框并搜索
    filterForm.orderSn = orderSnParam
    ElMessage.info(`已自动搜索订单：${orderSnParam}`)
  }

  loadOrders()
  loadExpressCompanies()
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
    console.log('原始筛选表单:', filterForm)

    if (filterForm.status !== null && filterForm.status !== undefined) {
      params.status = filterForm.status
      console.log('添加状态筛选:', filterForm.status)
    }
    if (filterForm.orderSn && filterForm.orderSn.trim()) {
      params.orderSn = filterForm.orderSn.trim()
      console.log('添加订单号筛选:', filterForm.orderSn.trim())
    }
    if (filterForm.userKeyword && filterForm.userKeyword.trim()) {
      params.userKeyword = filterForm.userKeyword.trim()
      console.log('添加用户关键词筛选:', filterForm.userKeyword.trim())
    }
    if (filterForm.startTime) {
      params.startTime = filterForm.startTime
      console.log('添加开始时间筛选:', filterForm.startTime)
    }
    if (filterForm.endTime) {
      params.endTime = filterForm.endTime
      console.log('添加结束时间筛选:', filterForm.endTime)
    }

    console.log('最终发送的查询参数:', params)

    const response = await axios.get('http://localhost:9999/order-service/api/v1/orders/admin/all', {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    console.log('API响应:', response.data)

    // 检查响应结构
    if (response.data && response.data.code === '000000') {
      const data = response.data.data
      console.log('成功响应的data:', data)

      if (data && data.records && Array.isArray(data.records)) {
        orders.value = data.records
        pagination.total = data.total || 0
        console.log('使用分页结构，records数量:', data.records.length)
      } else if (data && Array.isArray(data)) {
        orders.value = data
        pagination.total = data.length
        console.log('使用数组结构，数量:', data.length)
      } else {
        orders.value = []
        pagination.total = 0
        console.log('未找到有效数据结构')
      }
    } else {
      orders.value = []
      pagination.total = 0
      console.log('API响应失败:', response.data)
    }

    console.log('最终orders数量:', orders.value.length)
    console.log('最终total:', pagination.total)
  } catch (error) {
    console.error('加载订单失败:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

// 加载待发货订单（使用稳定的方案）
async function loadPendingDeliveryOrders() {
  loading.value = true
  try {
    console.log('加载待发货订单...')

    // 保存当前筛选状态
    const originalStatus = filterForm.status
    const originalOrderSn = filterForm.orderSn
    const originalUserKeyword = filterForm.userKeyword
    const originalStartTime = filterForm.startTime
    const originalEndTime = filterForm.endTime

    // 设置筛选条件为只查询已支付的订单
    filterForm.status = 1
    filterForm.orderSn = ''
    filterForm.userKeyword = ''
    filterForm.startTime = ''
    filterForm.endTime = ''

    const params: any = {
      page: 1,
      size: 100, // 获取更多数据
      status: 1  // 只查询已支付的订单（待发货）
    }

    console.log('待发货订单查询参数:', params)

    const response = await axios.get('http://localhost:9999/order-service/api/v1/orders/admin/all', {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    console.log('待发货订单API响应:', response.data)

    if (response.data && response.data.code === '000000') {
      const data = response.data.data

      let pendingOrders = []
      if (data && data.records && Array.isArray(data.records)) {
        // 分页结构
        pendingOrders = data.records.filter((order: any) => order.status === 1)
        console.log('使用分页结构，总记录数:', data.records.length, '待发货订单数:', pendingOrders.length)
      } else if (data && Array.isArray(data)) {
        // 数组结构
        pendingOrders = data.filter((order: any) => order.status === 1)
        console.log('使用数组结构，总记录数:', data.length, '待发货订单数:', pendingOrders.length)
      } else {
        console.log('未识别的数据结构:', data)
      }

      orders.value = pendingOrders
      pagination.total = pendingOrders.length

      console.log('最终待发货订单数量:', pendingOrders.length)

      if (pendingOrders.length > 0) {
        ElMessage.success(`已加载 ${pendingOrders.length} 个待发货订单`)
      } else {
        ElMessage.info('暂无待发货订单')
      }
    } else {
      orders.value = []
      pagination.total = 0
      console.log('API响应失败:', response.data)
      ElMessage.error(response.data?.msg || '加载待发货订单失败')
    }

    // 恢复原来的筛选状态
    filterForm.status = originalStatus
    filterForm.orderSn = originalOrderSn
    filterForm.userKeyword = originalUserKeyword
    filterForm.startTime = originalStartTime
    filterForm.endTime = originalEndTime
  } catch (error: any) {
    console.error('加载待发货订单失败:', error)
    console.log('错误详情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })

    if (error.response?.status === 401) {
      ElMessage.error('认证失败，请重新登录')
    } else {
      ElMessage.error(error.response?.data?.msg || '加载待发货订单失败')
    }
  } finally {
    loading.value = false
  }
}


// 加载快递公司列表
async function loadExpressCompanies() {
  try {
    const response = await axios.get('http://localhost:9999/order-service/api/v1/delivery/express/companies', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })
    expressCompanies.value = response.data.data || []
  } catch (error) {
    console.error('加载快递公司失败:', error)
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



// 打开发货弹窗
function openDeliveryDialog(order: any) {
  deliveryDialog.order = order
  deliveryDialog.visible = true

  // 重置表单
  deliveryForm.orderSn = order.orderSn
  deliveryForm.expressCode = ''
  deliveryForm.expressCompany = ''
  deliveryForm.trackingNumber = ''
  deliveryForm.remark = ''
}

// 提交发货
async function submitDelivery() {
  if (!deliveryFormRef.value) return

  const valid = await deliveryFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true

  try {
    await axios.post('http://localhost:9999/order-service/api/v1/delivery/create', deliveryForm, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success('发货成功')
    deliveryDialog.visible = false
    loadOrders()
  } catch (error: any) {
    console.error('发货失败:', error)
    ElMessage.error(error.response?.data?.msg || '发货失败')
  } finally {
    submitting.value = false
  }
}

// 查看物流信息
async function viewDeliveryInfo(order: any) {
  try {
    const response = await axios.get(`http://localhost:9999/order-service/api/v1/delivery/order/${order.orderSn}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    trackingInfo.value = response.data.data
    trackingDialog.visible = true
  } catch (error) {
    console.error('获取物流信息失败:', error)
    ElMessage.error('获取物流信息失败')
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

// 获取发货状态类型
function getDeliveryStatusType(status: number) {
  const types = {
    0: 'warning',  // 待发货
    1: 'primary',  // 已发货
    2: 'primary',  // 运输中
    3: 'success',  // 已签收
    4: 'danger'    // 异常
  }
  return types[status as keyof typeof types] || 'info'
}

// 获取收货人姓名
function getRecipientName(order: any) {
  if (order.userName) return order.userName
  if (!order.addressSnapshot) return '未知'
  try {
    const addr = JSON.parse(order.addressSnapshot)
    return addr.name || '未知'
  } catch {
    return '未知'
  }
}

// 获取收货人电话
function getRecipientPhone(order: any) {
  if (order.userPhone) return order.userPhone
  if (!order.addressSnapshot) return '未知'
  try {
    const addr = JSON.parse(order.addressSnapshot)
    return addr.phone || '未知'
  } catch {
    return '未知'
  }
}

// 获取完整地址
function getFullAddress(order: any) {
  if (!order.addressSnapshot) return '地址信息缺失'
  try {
    const addr = JSON.parse(order.addressSnapshot)
    return `${addr.province} ${addr.city} ${addr.district} ${addr.detail}`
  } catch {
    return '地址解析失败'
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
.delivery-management {
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

.order-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.order-info p {
  margin: 5px 0;
  color: #606266;
}

.tracking-info {
  max-height: 500px;
  overflow-y: auto;
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.delivery-header h3 {
  margin: 0;
  color: #303133;
}

.track-content {
  padding-left: 10px;
}

.track-status {
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.track-info {
  color: #606266;
  margin-bottom: 3px;
}

.track-location {
  color: #909399;
  font-size: 12px;
}
</style>
