<template>
  <div class="refund-audit-container">
    <h2 class="page-title">退款审核</h2>
    <el-divider />

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filter" inline>
        <el-form-item label="审核状态">
          <el-select v-model="filter.status" placeholder="全部状态" clearable style="width: 150px;" @change="loadRefunds">
            <el-option label="待审核" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="成功" :value="2" />
            <el-option label="失败" :value="3" />
            <el-option label="已拒绝" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input
            v-model="filter.orderSn"
            placeholder="请输入订单号"
            clearable
            style="width: 200px;"
            @clear="loadRefunds"
            @keyup.enter="loadRefunds"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRefunds">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 批量操作 -->
    <div class="batch-actions" v-if="selectedRefunds.length > 0">
      <el-button type="success" @click="batchAudit('APPROVED')" :loading="auditing">
        批量通过 ({{ selectedRefunds.length }})
      </el-button>
      <el-button type="danger" @click="batchAudit('REJECTED')" :loading="auditing">
        批量拒绝 ({{ selectedRefunds.length }})
      </el-button>
    </div>

    <!-- 退款列表 -->
    <div class="table-section">
      <el-table
        :data="refunds"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="refundSn" label="退款单号" width="180" />
        <el-table-column prop="orderSn" label="订单号" width="180" />
        <el-table-column prop="refundAmount" label="退款金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ row.refundAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="refundTypeName" label="退款方式" width="120" />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">
              查看详情
            </el-button>
            <el-button
              v-if="row.status === 0"
              type="success"
              size="small"
              @click="auditRefund(row, 'APPROVED')"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 0"
              type="danger"
              size="small"
              @click="auditRefund(row, 'REJECTED')"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="filter.page"
        v-model:page-size="filter.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadRefunds"
        @current-change="loadRefunds"
      />
    </div>

    <!-- 退款详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="退款详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="detailDialog.refund" class="refund-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="退款单号">{{ detailDialog.refund.refundSn }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ detailDialog.refund.orderSn }}</el-descriptions-item>
          <el-descriptions-item label="退款金额">
            <span class="amount">¥{{ detailDialog.refund.refundAmount.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="退款方式">{{ detailDialog.refund.refundTypeName }}</el-descriptions-item>
          <el-descriptions-item label="退款原因">{{ detailDialog.refund.reason }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatTime(detailDialog.refund.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="联系电话" v-if="detailDialog.refund.contactPhone">
            {{ detailDialog.refund.contactPhone }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detailDialog.refund.status)">
              {{ detailDialog.refund.statusName }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="detailDialog.refund.description" class="description-section">
          <h4>问题描述</h4>
          <p>{{ detailDialog.refund.description }}</p>
        </div>

        <div v-if="detailDialog.refund.images && detailDialog.refund.images.length > 0" class="images-section">
          <h4>问题图片</h4>
          <div class="images-list">
            <el-image
              v-for="(image, index) in detailDialog.refund.images"
              :key="index"
              :src="image"
              :preview-src-list="detailDialog.refund.images"
              :initial-index="index"
              fit="cover"
              class="refund-image"
            />
          </div>
        </div>

        <div v-if="detailDialog.refund.auditRemark" class="audit-section">
          <h4>审核备注</h4>
          <p>{{ detailDialog.refund.auditRemark }}</p>
          <p class="audit-info">
            审核人：{{ detailDialog.refund.auditBy }} |
            审核时间：{{ formatTime(detailDialog.refund.auditTime) }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关闭</el-button>
          <el-button
            v-if="detailDialog.refund?.status === 0"
            type="success"
            @click="auditRefund(detailDialog.refund, 'APPROVED')"
          >
            通过
          </el-button>
          <el-button
            v-if="detailDialog.refund?.status === 0"
            type="danger"
            @click="auditRefund(detailDialog.refund, 'REJECTED')"
          >
            拒绝
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="auditDialog.visible"
      :title="auditDialog.type === 'APPROVED' ? '通过退款申请' : '拒绝退款申请'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核备注">
          <el-input
            v-model="auditForm.auditRemark"
            type="textarea"
            :rows="4"
            :placeholder="auditDialog.type === 'APPROVED' ? '请输入通过原因（可选）' : '请输入拒绝原因'"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="auditDialog.visible = false">取消</el-button>
          <el-button
            :type="auditDialog.type === 'APPROVED' ? 'success' : 'danger'"
            @click="confirmAudit"
            :loading="auditing"
          >
            确认{{ auditDialog.type === 'APPROVED' ? '通过' : '拒绝' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { refundApi } from '../../api/refund'
import type { RefundRecord, RefundFilter } from '../../types/refund'
import axios from 'axios'

const loading = ref(false)
const auditing = ref(false)
const refunds = ref<RefundRecord[]>([])
const total = ref(0)
const selectedRefunds = ref<RefundRecord[]>([])

const filter = reactive<RefundFilter>({
  page: 1,
  pageSize: 10
})

const detailDialog = reactive({
  visible: false,
  refund: null as RefundRecord | null
})

const auditDialog = reactive({
  visible: false,
  type: 'APPROVED' as 'APPROVED' | 'REJECTED',
  refundSns: [] as string[]
})

const auditForm = reactive({
  auditRemark: ''
})

// 加载退款列表
const loadRefunds = async () => {
  loading.value = true
  try {
    const response = await refundApi.getRefundList(filter)
    refunds.value = response.items || []
    total.value = response.total || 0
  } catch (error: any) {
    console.error('加载退款列表失败:', error)
    ElMessage.error('加载退款列表失败')
  } finally {
    loading.value = false
  }
}

// 处理选择变化
const handleSelectionChange = (selection: RefundRecord[]) => {
  selectedRefunds.value = selection
}

// 批量审核
const batchAudit = async (auditResult: 'APPROVED' | 'REJECTED') => {
  if (selectedRefunds.value.length === 0) {
    ElMessage.warning('请选择要审核的退款申请')
    return
  }

  auditDialog.type = auditResult
  auditDialog.refundSns = selectedRefunds.value.map(item => item.refundSn)
  auditDialog.visible = true
  auditForm.auditRemark = ''
}

// 单个审核
const auditRefund = (refund: RefundRecord, auditResult: 'APPROVED' | 'REJECTED') => {
  auditDialog.type = auditResult
  auditDialog.refundSns = [refund.refundSn]
  auditDialog.visible = true
  auditForm.auditRemark = ''
}

// 确认审核
const confirmAudit = async () => {
  auditing.value = true
  try {
    // 判断是单个审核还是批量审核
    if (auditDialog.refundSns.length === 1) {
      // 单个审核
      await axios.post('http://localhost:9999/payment-service/api/v1/refund/audit', {
        refundSn: auditDialog.refundSns[0],
        auditResult: auditDialog.type,
        auditRemark: auditForm.auditRemark,
        auditBy: 'admin'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
      })
    } else {
      // 批量审核
      await axios.post('http://localhost:9999/payment-service/api/v1/refund/audit', {
        refundSns: auditDialog.refundSns,
        auditResult: auditDialog.type,
        auditRemark: auditForm.auditRemark,
        auditBy: 'admin'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
      })
    }

    const action = auditDialog.type === 'APPROVED' ? '通过' : '拒绝'
    ElMessage.success(`退款申请${action}成功`)
    auditDialog.visible = false
    detailDialog.visible = false
    selectedRefunds.value = []
    loadRefunds()
  } catch (error: any) {
    console.error('审核失败:', error)
    ElMessage.error(error.response?.data?.msg || '审核失败')
  } finally {
    auditing.value = false
  }
}

// 查看详情
const viewDetail = (refund: RefundRecord) => {
  detailDialog.refund = refund
  detailDialog.visible = true
}

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 获取状态类型
const getStatusType = (status: number) => {
  switch (status) {
    case 0: return 'warning' // 待审核
    case 1: return 'primary' // 处理中
    case 2: return 'success' // 成功
    case 3: return 'danger'  // 失败
    case 4: return 'danger'  // 已拒绝
    default: return 'info'
  }
}

onMounted(() => {
  loadRefunds()
})
</script>

<style scoped>
.refund-audit-container {
  width: 100%;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
}

.filter-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.batch-actions {
  margin-bottom: 20px;
  padding: 16px;
  background: #e6f7ff;
  border-radius: 6px;
  border: 1px solid #91d5ff;
}

.table-section {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.amount {
  color: #e6a23c;
  font-weight: 500;
}

.refund-detail {
  max-height: 600px;
  overflow-y: auto;
}

.description-section,
.images-section,
.audit-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.description-section h4,
.images-section h4,
.audit-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.description-section p,
.audit-section p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.audit-info {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.images-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.refund-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-footer {
  text-align: right;
}
</style>
