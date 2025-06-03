<template>
  <div class="refund-progress">
    <el-dialog
      v-model="visible"
      title="退款进度跟踪"
      width="700px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <div v-if="refundDetail" class="progress-content">
        <!-- 基本信息 -->
        <div class="basic-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="退款单号">{{ refundDetail.refundSn }}</el-descriptions-item>
            <el-descriptions-item label="订单号">{{ refundDetail.orderSn }}</el-descriptions-item>
            <el-descriptions-item label="退款金额">
              <span class="amount">¥{{ refundDetail.refundAmount.toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(refundDetail.status)">
                {{ refundDetail.statusName }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="退款方式">
              {{ getRefundMethodName(refundDetail.refundMethod) }}
            </el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatTime(refundDetail.applyTime) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 进度时间线 -->
        <div class="progress-timeline">
          <h4>退款进度</h4>
          <el-timeline>
            <!-- 申请退款 -->
            <el-timeline-item
              timestamp="申请退款"
              :color="refundDetail.status >= 0 ? '#67c23a' : '#e4e7ed'"
              size="large"
            >
              <div class="timeline-content">
                <div class="timeline-title">提交退款申请</div>
                <div class="timeline-desc">{{ formatTime(refundDetail.applyTime) }}</div>
                <div class="timeline-detail">
                  <p>退款原因：{{ refundDetail.refundReason }}</p>
                  <p v-if="refundDetail.refundDescription">问题描述：{{ refundDetail.refundDescription }}</p>
                </div>
              </div>
            </el-timeline-item>

            <!-- 审核处理 -->
            <el-timeline-item
              v-if="refundDetail.status >= 1 || refundDetail.status === 2"
              timestamp="审核处理"
              :color="refundDetail.status >= 1 ? '#67c23a' : refundDetail.status === 2 ? '#f56c6c' : '#e4e7ed'"
              size="large"
            >
              <div class="timeline-content">
                <div class="timeline-title">
                  {{ refundDetail.status === 1 ? '审核通过' : refundDetail.status === 2 ? '审核拒绝' : '审核中' }}
                </div>
                <div class="timeline-desc" v-if="refundDetail.processTime">
                  {{ formatTime(refundDetail.processTime) }}
                </div>
                <div class="timeline-detail" v-if="refundDetail.processRemark">
                  <p>处理备注：{{ refundDetail.processRemark }}</p>
                </div>
              </div>
            </el-timeline-item>

            <!-- 退款处理 -->
            <el-timeline-item
              v-if="refundDetail.status >= 3"
              timestamp="退款处理"
              :color="refundDetail.status >= 3 ? '#409eff' : '#e4e7ed'"
              size="large"
            >
              <div class="timeline-content">
                <div class="timeline-title">开始处理退款</div>
                <div class="timeline-desc">系统正在处理退款...</div>
                <div class="timeline-detail">
                  <p>退款方式：{{ getRefundMethodName(refundDetail.refundMethod) }}</p>
                  <p>预计到账时间：1-3个工作日</p>
                </div>
              </div>
            </el-timeline-item>

            <!-- 退款完成 -->
            <el-timeline-item
              v-if="refundDetail.status >= 4"
              timestamp="退款完成"
              :color="refundDetail.status === 4 ? '#67c23a' : refundDetail.status === 5 ? '#f56c6c' : '#e4e7ed'"
              size="large"
            >
              <div class="timeline-content">
                <div class="timeline-title">
                  {{ refundDetail.status === 4 ? '退款成功' : '退款失败' }}
                </div>
                <div class="timeline-desc" v-if="refundDetail.refundTime">
                  {{ formatTime(refundDetail.refundTime) }}
                </div>
                <div class="timeline-detail">
                  <p v-if="refundDetail.status === 4">
                    退款已成功到账，请查收
                  </p>
                  <p v-else>
                    退款处理失败，请联系客服
                  </p>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 资金流水 -->
        <div class="fund-flows" v-if="refundDetail.refundFlow">
          <h4>资金流水</h4>
          <el-table :data="[refundDetail.refundFlow]" size="small">
            <el-table-column prop="flowTypeName" label="流水类型" width="120" />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">
                ¥{{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="beforeBalance" label="操作前余额" width="120">
              <template #default="{ row }">
                ¥{{ row.beforeBalance.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="afterBalance" label="操作后余额" width="120">
              <template #default="{ row }">
                ¥{{ row.afterBalance.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 联系客服 -->
        <div class="contact-service" v-if="refundDetail.status === 5 || refundDetail.status === 2">
          <el-alert
            :title="refundDetail.status === 5 ? '退款失败' : '申请被拒绝'"
            :description="refundDetail.status === 5 ? '如有疑问，请联系客服处理' : '如有异议，请联系客服申诉'"
            type="warning"
            show-icon
            :closable="false"
          >
            <template #default>
              <div class="service-actions">
                <el-button size="small" type="primary" @click="contactService">
                  联系客服
                </el-button>
                <el-button size="small" @click="viewOrderDetail">
                  查看订单
                </el-button>
              </div>
            </template>
          </el-alert>
        </div>
      </div>

      <div v-else class="loading-content">
        <el-skeleton :rows="5" animated />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="primary" @click="refreshProgress">刷新进度</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { refundApi } from '../api/refund'
import type { RefundRecord } from '../types/refund'

interface Props {
  modelValue: boolean
  refundSn?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'contact-service', refundSn: string): void
  (e: 'view-order', orderSn: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const refundDetail = ref<RefundRecord | null>(null)

// 监听对话框打开
watch(visible, (newVal) => {
  if (newVal && props.refundSn) {
    loadRefundDetail()
  }
})

// 加载退款详情
const loadRefundDetail = async () => {
  if (!props.refundSn) return

  loading.value = true
  try {
    refundDetail.value = await refundApi.getRefundDetail(props.refundSn)
  } catch (error: any) {
    ElMessage.error('加载退款详情失败')
  } finally {
    loading.value = false
  }
}

// 刷新进度
const refreshProgress = () => {
  loadRefundDetail()
  ElMessage.success('进度已刷新')
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取状态类型
const getStatusType = (status: number) => {
  switch (status) {
    case 0: return 'warning' // 待审核
    case 1: return 'success' // 已同意
    case 2: return 'danger'  // 已拒绝
    case 3: return 'primary' // 退款中
    case 4: return 'success' // 退款成功
    case 5: return 'danger'  // 退款失败
    default: return 'info'
  }
}

// 获取退款方式名称
const getRefundMethodName = (method: string) => {
  switch (method) {
    case 'BALANCE': return '退回余额'
    case 'ORIGINAL': return '原路退回'
    case 'BANK': return '银行卡'
    default: return '未知'
  }
}

// 联系客服
const contactService = () => {
  if (refundDetail.value) {
    emit('contact-service', refundDetail.value.refundSn)
  }
}

// 查看订单详情
const viewOrderDetail = () => {
  if (refundDetail.value) {
    emit('view-order', refundDetail.value.orderSn)
  }
}

// 关闭对话框
const handleClose = () => {
  refundDetail.value = null
  emit('update:modelValue', false)
}
</script>

<style scoped>
.progress-content {
  max-height: 70vh;
  overflow-y: auto;
}

.basic-info {
  margin-bottom: 30px;
}

.amount {
  color: #e6a23c;
  font-weight: 500;
}

.progress-timeline {
  margin-bottom: 30px;
}

.progress-timeline h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.timeline-content {
  padding-left: 10px;
}

.timeline-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.timeline-detail {
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.timeline-detail p {
  margin: 4px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.fund-flows {
  margin-bottom: 20px;
}

.fund-flows h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.contact-service {
  margin-top: 20px;
}

.service-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.loading-content {
  padding: 20px;
}

.dialog-footer {
  text-align: right;
}
</style>
