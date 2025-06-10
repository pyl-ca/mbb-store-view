<template>
  <div class="refund-management">
    <div class="page-header">
      <h2>退款管理</h2>
      <div class="header-actions">
        <el-button @click="loadRefunds" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="退款状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 160px;">
            <el-option label="待业务审核" value="0" />
            <el-option label="待财务审核" value="1" />
            <el-option label="处理中" value="2" />
            <el-option label="成功" value="3" />
            <el-option label="失败" value="4" />
            <el-option label="业务拒绝" value="5" />
            <el-option label="财务拒绝" value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款类型">
          <el-select v-model="filterForm.refundType" placeholder="请选择类型" clearable style="width: 140px;">
            <el-option label="余额退款" value="BALANCE" />
            <el-option label="原路退回" value="ORIGINAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="filterForm.orderSn" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="退款单号">
          <el-input v-model="filterForm.refundSn" placeholder="请输入退款单号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchRefunds">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 退货列表 -->
    <div class="table-section">
      <div class="table-header">
        <div class="batch-actions">
          <el-button
            type="success"
            :disabled="selectedRefunds.length === 0 || !canBatchBusinessAudit"
            @click="batchBusinessAudit('APPROVED')"
          >
            批量业务通过
          </el-button>
          <el-button
            type="danger"
            :disabled="selectedRefunds.length === 0 || !canBatchBusinessAudit"
            @click="batchBusinessAudit('REJECTED')"
          >
            批量业务拒绝
          </el-button>
          <el-button
            type="primary"
            :disabled="selectedRefunds.length === 0 || !canBatchFinanceAudit"
            @click="batchFinanceAudit('APPROVED')"
          >
            批量财务通过
          </el-button>
          <el-button
            type="warning"
            :disabled="selectedRefunds.length === 0 || !canBatchFinanceAudit"
            @click="batchFinanceAudit('REJECTED')"
          >
            批量财务拒绝
          </el-button>
          <span class="selected-count">已选择 {{ selectedRefunds.length }} 项</span>
        </div>
      </div>
      <el-table
        :data="refunds"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="refundSn" label="退款单号" width="180" />
        <el-table-column prop="orderSn" label="订单号" width="180" />
        <el-table-column prop="userName" label="用户" width="120" />
        <el-table-column prop="refundTypeName" label="退款类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.refundType === 'BALANCE' ? 'warning' : 'primary'">
              {{ row.refundTypeName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="refundAmount" label="退款金额" width="120">
          <template #default="{ row }">
            ¥{{ row.refundAmount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" width="150" show-overflow-tooltip />
        <el-table-column prop="statusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewRefundDetail(row)">详情</el-button>
            <!-- 业务审核按钮 -->
            <el-button
              v-if="row.status === 0"
              type="success"
              size="small"
              @click="businessApprove(row)"
            >
              业务通过
            </el-button>
            <el-button
              v-if="row.status === 0"
              type="danger"
              size="small"
              @click="businessReject(row)"
            >
              业务拒绝
            </el-button>
            <!-- 财务审核按钮 -->
            <el-button
              v-if="row.status === 1"
              type="primary"
              size="small"
              @click="financeApprove(row)"
            >
              财务通过
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              size="small"
              @click="financeReject(row)"
            >
              财务拒绝
            </el-button>
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
          @size-change="loadRefunds"
          @current-change="loadRefunds"
        />
      </div>
    </div>

    <!-- 退货详情弹窗 -->
    <el-dialog v-model="detailDialog.visible" title="退货详情" width="800px">
      <div v-if="refundDetail" class="refund-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">退款单号：</span>
              <span class="value">{{ refundDetail.refundSn }}</span>
            </div>
            <div class="info-item">
              <span class="label">订单号：</span>
              <span class="value">{{ refundDetail.orderSn }}</span>
            </div>
            <div class="info-item">
              <span class="label">退款类型：</span>
              <span class="value">{{ refundDetail.refundTypeName }}</span>
            </div>
            <div class="info-item">
              <span class="label">退款金额：</span>
              <span class="value amount">¥{{ refundDetail.refundAmount }}</span>
            </div>
            <div class="info-item">
              <span class="label">退款原因：</span>
              <span class="value">{{ refundDetail.reason }}</span>
            </div>
            <div class="info-item">
              <span class="label">申请时间：</span>
              <span class="value">{{ formatTime(refundDetail.createTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">联系电话：</span>
              <span class="value">{{ refundDetail.contactPhone }}</span>
            </div>
          </div>
        </div>

        <!-- 问题描述 -->
        <div class="detail-section" v-if="refundDetail.description">
          <h4>问题描述</h4>
          <p class="description">{{ refundDetail.description }}</p>
        </div>

        <!-- 退款图片 -->
        <div class="detail-section" v-if="refundDetail.images && refundDetail.images.length > 0">
          <h4>退款图片</h4>
          <div class="image-gallery">
            <el-image
              v-for="(image, index) in refundDetail.images"
              :key="index"
              :src="getRefundImageUrl(image)"
              :preview-src-list="refundDetail.images?.map(img => getRefundImageUrl(img))"
              :initial-index="index"
              fit="cover"
              class="refund-image"
            />
          </div>
        </div>

        <!-- 审核记录 -->
        <div class="detail-section" v-if="refundDetail.auditTime">
          <h4>审核记录</h4>
          <div class="process-info">
            <p><strong>审核时间：</strong>{{ formatTime(refundDetail.auditTime) }}</p>
            <p><strong>审核人：</strong>{{ refundDetail.auditBy || '系统' }}</p>
            <p><strong>审核结果：</strong>{{ refundDetail.statusName }}</p>
            <p v-if="refundDetail.auditRemark"><strong>审核备注：</strong>{{ refundDetail.auditRemark }}</p>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditDialog.visible" :title="auditDialog.title" width="500px">
      <el-form :model="auditForm" :rules="auditRules" ref="auditFormRef" label-width="80px">
        <el-form-item label="审核结果">
          <el-tag :type="getAuditTagType(auditDialog.type)">
            {{ getAuditResultText(auditDialog.type) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="审核备注" prop="auditRemark">
          <el-input
            v-model="auditForm.auditRemark"
            type="textarea"
            :rows="4"
            :placeholder="getAuditPlaceholder(auditDialog.type)"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button
          :type="getAuditButtonType(auditDialog.type)"
          @click="submitAudit"
          :loading="auditing"
        >
          确认{{ getAuditButtonText(auditDialog.type) }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { refundApi } from '../../api/refund'
import { getRefundImageUrl } from '../../utils/imageUtils'

// 数据定义
const loading = ref(false)
const auditing = ref(false)
const refunds = ref([])
const refundDetail = ref<any>(null)
const selectedRefunds = ref<any[]>([])

// 筛选表单
const filterForm = reactive({
  status: '',
  refundType: '',
  orderSn: '',
  refundSn: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 详情弹窗
const detailDialog = reactive({
  visible: false
})

// 审核弹窗
const auditDialog = reactive({
  visible: false,
  title: '',
  type: '', // 'approve' | 'reject'
  refundSn: '' as string  // 使用退款单号
})

const auditForm = reactive({
  auditRemark: ''
})

const auditFormRef = ref()

const auditRules = {
  auditRemark: [
    { required: true, message: '请输入审核备注', trigger: 'blur', when: () => auditDialog.type === 'reject' }
  ]
}

// 计算属性
const canBatchBusinessAudit = computed(() => {
  return selectedRefunds.value.every(item => item.status === 0)
})

const canBatchFinanceAudit = computed(() => {
  return selectedRefunds.value.every(item => item.status === 1)
})

// 页面初始化
onMounted(() => {
  loadRefunds()
})

// 加载退货列表
async function loadRefunds() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...filterForm
    }

    const response = await axios.get('/payment-service/api/v1/refund/admin/records', {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    refunds.value = response.data.data.records || []
    pagination.total = response.data.data.total || 0


  } catch (error) {
    console.error('加载退货列表失败:', error)
    ElMessage.error('加载退货列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索退货
function searchRefunds() {
  pagination.page = 1
  loadRefunds()
}

// 重置筛选
function resetFilter() {
  Object.keys(filterForm).forEach(key => {
    filterForm[key as keyof typeof filterForm] = ''
  })
  pagination.page = 1
  loadRefunds()
}

// 查看退款详情
async function viewRefundDetail(refund: any) {
  try {
    const response = await axios.get(`/payment-service/api/v1/refund/${refund.refundSn}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    refundDetail.value = response.data.data
    detailDialog.visible = true
  } catch (error) {
    console.error('获取退款详情失败:', error)
    ElMessage.error('获取退款详情失败')
  }
}

// 通过退款申请
function approveRefund(refund: any) {
  auditDialog.visible = true
  auditDialog.title = '通过退款申请'
  auditDialog.type = 'approve'
  auditDialog.refundSn = refund.refundSn
  auditForm.auditRemark = ''
}

// 拒绝退款申请
function rejectRefund(refund: any) {
  auditDialog.visible = true
  auditDialog.title = '拒绝退款申请'
  auditDialog.type = 'reject'
  auditDialog.refundSn = refund.refundSn
  auditForm.auditRemark = ''
}

// 提交审核
async function submitAudit() {
  const isReject = auditDialog.type.includes('reject')
  if (isReject && !auditForm.auditRemark.trim()) {
    ElMessage.error('请输入拒绝原因')
    return
  }

  try {
    const actionText = getAuditButtonText(auditDialog.type)
    await ElMessageBox.confirm(
      `确定要${actionText}这个退款申请吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    auditing.value = true

    const auditResult: 'APPROVED' | 'REJECTED' = isReject ? 'REJECTED' : 'APPROVED'
    const requestData = {
      refundSns: [auditDialog.refundSn],
      auditResult,
      auditRemark: auditForm.auditRemark,
      auditBy: 'admin'
    }

    // 根据审核类型调用不同的API
    if (auditDialog.type.includes('business')) {
      await refundApi.businessAudit(requestData)
    } else if (auditDialog.type.includes('finance')) {
      await refundApi.financeAudit(requestData)
    }

    ElMessage.success(`${actionText}成功`)
    auditDialog.visible = false
    loadRefunds()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('审核失败:', error)
      ElMessage.error(error.message || '审核失败')
    }
  } finally {
    auditing.value = false
  }
}

// 获取状态类型
function getStatusType(status: number) {
  const types = {
    0: 'warning',  // 待业务审核
    1: 'primary',  // 待财务审核
    2: 'info',     // 处理中
    3: 'success',  // 成功
    4: 'danger',   // 失败
    5: 'danger',   // 业务拒绝
    6: 'danger'    // 财务拒绝
  }
  return types[status as keyof typeof types] || 'info'
}

// 处理选择变化
function handleSelectionChange(selection: any[]) {
  selectedRefunds.value = selection
}

// 业务审核通过
function businessApprove(refund: any) {
  auditDialog.visible = true
  auditDialog.title = '业务审核通过'
  auditDialog.type = 'business_approve'
  auditDialog.refundSn = refund.refundSn
  auditForm.auditRemark = ''
}

// 业务审核拒绝
function businessReject(refund: any) {
  auditDialog.visible = true
  auditDialog.title = '业务审核拒绝'
  auditDialog.type = 'business_reject'
  auditDialog.refundSn = refund.refundSn
  auditForm.auditRemark = ''
}

// 财务审核通过
function financeApprove(refund: any) {
  auditDialog.visible = true
  auditDialog.title = '财务审核通过'
  auditDialog.type = 'finance_approve'
  auditDialog.refundSn = refund.refundSn
  auditForm.auditRemark = ''
}

// 财务审核拒绝
function financeReject(refund: any) {
  auditDialog.visible = true
  auditDialog.title = '财务审核拒绝'
  auditDialog.type = 'finance_reject'
  auditDialog.refundSn = refund.refundSn
  auditForm.auditRemark = ''
}

// 批量业务审核
async function batchBusinessAudit(auditResult: 'APPROVED' | 'REJECTED') {
  if (selectedRefunds.value.length === 0) {
    ElMessage.warning('请选择要审核的退款申请')
    return
  }

  if (!canBatchBusinessAudit.value) {
    ElMessage.warning('只能对待业务审核的退款申请进行批量业务审核')
    return
  }

  const action = auditResult === 'APPROVED' ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(
      `确定要批量业务${action}选中的 ${selectedRefunds.value.length} 个退款申请吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    auditing.value = true
    const refundSns = selectedRefunds.value.map((item: any) => item.refundSn)

    await refundApi.businessAudit({
      refundSns,
      auditResult,
      auditRemark: `批量业务${action}`,
      auditBy: 'admin'
    })

    ElMessage.success(`批量业务${action}成功`)
    selectedRefunds.value = []
    loadRefunds()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量业务审核失败:', error)
      ElMessage.error(error.message || '批量业务审核失败')
    }
  } finally {
    auditing.value = false
  }
}

// 批量财务审核
async function batchFinanceAudit(auditResult: 'APPROVED' | 'REJECTED') {
  if (selectedRefunds.value.length === 0) {
    ElMessage.warning('请选择要审核的退款申请')
    return
  }

  if (!canBatchFinanceAudit.value) {
    ElMessage.warning('只能对待财务审核的退款申请进行批量财务审核')
    return
  }

  const action = auditResult === 'APPROVED' ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(
      `确定要批量财务${action}选中的 ${selectedRefunds.value.length} 个退款申请吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    auditing.value = true
    const refundSns = selectedRefunds.value.map((item: any) => item.refundSn)

    await refundApi.financeAudit({
      refundSns,
      auditResult,
      auditRemark: `批量财务${action}`,
      auditBy: 'admin'
    })

    ElMessage.success(`批量财务${action}成功`)
    selectedRefunds.value = []
    loadRefunds()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量财务审核失败:', error)
      ElMessage.error(error.message || '批量财务审核失败')
    }
  } finally {
    auditing.value = false
  }
}

// 批量审核（保留兼容性）
async function batchAudit(auditResult: string) {
  if (selectedRefunds.value.length === 0) {
    ElMessage.warning('请选择要审核的退款申请')
    return
  }

  const action = auditResult === 'APPROVED' ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(
      `确定要批量${action}选中的 ${selectedRefunds.value.length} 个退款申请吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    auditing.value = true
    const refundSns = selectedRefunds.value.map((item: any) => item.refundSn)

    await axios.post('/payment-service/api/v1/refund/audit', {
      refundSns,
      auditResult,
      auditRemark: `批量${action}`,
      auditBy: 'admin'
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success(`批量${action}成功`)
    selectedRefunds.value = []
    loadRefunds()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量审核失败:', error)
      ElMessage.error(error.response?.data?.msg || '批量审核失败')
    }
  } finally {
    auditing.value = false
  }
}

// 获取审核标签类型
function getAuditTagType(type: string) {
  switch (type) {
    case 'business_approve':
    case 'finance_approve':
      return 'success'
    case 'business_reject':
    case 'finance_reject':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取审核结果文本
function getAuditResultText(type: string) {
  switch (type) {
    case 'business_approve':
      return '业务审核通过'
    case 'business_reject':
      return '业务审核拒绝'
    case 'finance_approve':
      return '财务审核通过'
    case 'finance_reject':
      return '财务审核拒绝'
    default:
      return '审核'
  }
}

// 获取审核占位符文本
function getAuditPlaceholder(type: string) {
  switch (type) {
    case 'business_approve':
      return '请输入业务审核通过的备注（可选）'
    case 'business_reject':
      return '请输入业务审核拒绝的原因'
    case 'finance_approve':
      return '请输入财务审核通过的备注（可选）'
    case 'finance_reject':
      return '请输入财务审核拒绝的原因'
    default:
      return '请输入审核备注'
  }
}

// 获取审核按钮类型
function getAuditButtonType(type: string) {
  switch (type) {
    case 'business_approve':
    case 'finance_approve':
      return 'success'
    case 'business_reject':
    case 'finance_reject':
      return 'danger'
    default:
      return 'primary'
  }
}

// 获取审核按钮文本
function getAuditButtonText(type: string) {
  switch (type) {
    case 'business_approve':
      return '业务通过'
    case 'business_reject':
      return '业务拒绝'
    case 'finance_approve':
      return '财务通过'
    case 'finance_reject':
      return '财务拒绝'
    default:
      return '确认'
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
.refund-management {
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

/* 详情弹窗样式 */
.refund-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  color: #666;
  margin-right: 8px;
  min-width: 80px;
  font-size: 13px;
}

.info-item .value {
  color: #333;
  font-size: 13px;
}

.info-item .value.amount {
  color: #ff6700;
  font-weight: 600;
}

.description {
  color: #666;
  line-height: 1.6;
  margin: 0;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 13px;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.refund-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
}

.process-info p {
  margin: 8px 0;
  color: #666;
  font-size: 13px;
}

/* 表格头部样式 */
.table-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  color: #666;
  font-size: 14px;
  margin-left: auto;
}
</style>
