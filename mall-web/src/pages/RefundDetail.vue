<template>
  <div class="refund-detail-container">
    <div class="page-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="page-title">退款详情</h1>
    </div>

    <div v-if="loading" class="loading-container" v-loading="loading">
      <div style="height: 200px;"></div>
    </div>

    <div v-else-if="!refundDetail" class="empty-container">
      <el-empty description="退款记录不存在" />
    </div>

    <div v-else class="refund-detail-content">
      <!-- 退款状态卡片 -->
      <div class="status-card">
        <div class="status-header">
          <div class="status-info">
            <h3 class="refund-sn">退款单号：{{ refundDetail.refundSn }}</h3>
            <div class="status-badge">
              <el-tag
                :type="getStatusType(refundDetail.status)"
                size="large"
              >
                {{ refundDetail.statusName }}
              </el-tag>
            </div>
          </div>
          <div class="refund-amount">
            <span class="amount-label">退款金额</span>
            <span class="amount-value">¥{{ refundDetail.refundAmount?.toFixed(2) || '0.00' }}</span>
          </div>
        </div>
      </div>

      <!-- 基本信息卡片 -->
      <div class="info-card">
        <h3 class="card-title">基本信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="退款单号">{{ refundDetail.refundSn }}</el-descriptions-item>
          <el-descriptions-item label="关联订单">{{ refundDetail.orderSn }}</el-descriptions-item>
          <el-descriptions-item label="退款类型">{{ refundDetail.refundTypeName || getRefundTypeName(refundDetail.refundType) }}</el-descriptions-item>
          <el-descriptions-item label="退款状态">
            <el-tag :type="getStatusType(refundDetail.status)">
              {{ refundDetail.statusName || getStatusName(refundDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="退款金额">
            <span class="amount">¥{{ refundDetail.refundAmount?.toFixed(2) || '0.00' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatTime(refundDetail.applyTime || refundDetail.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="退款原因">{{ refundDetail.reason || refundDetail.refundReason || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话" v-if="refundDetail.contactPhone">{{ refundDetail.contactPhone }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 订单商品信息 -->
      <div v-if="refundDetail.orderInfo?.orderItems?.length" class="order-card">
        <h3 class="card-title">关联商品</h3>
        <div class="product-list">
          <div
            v-for="item in refundDetail.orderInfo.orderItems"
            :key="item.id"
            class="product-item"
          >
            <el-image
              :src="getProductImageUrl(item.productImage)"
              fit="cover"
              class="product-image"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>商品图片加载失败</span>
                </div>
              </template>
            </el-image>
            <div class="product-details">
              <h4 class="product-name">{{ item.productName }}</h4>
              <p class="product-specs">{{ item.specs }}</p>
              <div class="product-price">
                <span class="price">¥{{ item.price?.toFixed(2) || '0.00' }}</span>
                <span class="quantity">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 问题描述 -->
      <div v-if="refundDetail.description || refundDetail.refundDescription" class="description-card">
        <h3 class="card-title">问题描述</h3>
        <p class="description-text">{{ refundDetail.description || refundDetail.refundDescription }}</p>
      </div>

      <!-- 退款图片 -->
      <div v-if="refundDetail.images?.length > 0" class="images-card">
        <h3 class="card-title">问题图片</h3>
        <div class="images-list">
          <el-image
            v-for="(image, index) in refundDetail.images"
            :key="index"
            :src="getRefundImageUrl(image)"
            :preview-src-list="refundDetail.images?.map(img => getRefundImageUrl(img))"
            :initial-index="index"
            fit="cover"
            class="refund-image"
            lazy
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <span>图片加载失败</span>
              </div>
            </template>
          </el-image>
        </div>
      </div>

      <!-- 处理备注 -->
      <div v-if="refundDetail.processRemark || refundDetail.auditRemark" class="remark-card">
        <h3 class="card-title">处理备注</h3>
        <p class="remark-text">{{ refundDetail.processRemark || refundDetail.auditRemark }}</p>
      </div>

      <!-- 审核流程 -->
      <div class="timeline-card">
        <div class="card-header">
          <h3 class="card-title">审核流程</h3>
          <el-button @click="loadAuditFlow" size="small" icon="Refresh">刷新</el-button>
        </div>

        <div v-if="auditFlowLoading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>

        <el-timeline v-else>
          <!-- 申请退款 -->
          <el-timeline-item
            timestamp="申请退款"
            color="#67c23a"
            icon="Document"
          >
            <div class="timeline-content">
              <h4>用户申请退款</h4>
              <p>{{ formatTime(refundDetail.createTime) }}</p>
              <p>退款原因：{{ refundDetail.reason }}</p>
            </div>
          </el-timeline-item>

          <!-- 业务审核 -->
          <el-timeline-item
            timestamp="业务审核"
            :color="getAuditStepColor(0)"
            :icon="getAuditStepIcon(0)"
          >
            <div class="timeline-content">
              <h4>业务审核</h4>
              <p v-if="refundDetail.businessAuditTime">
                {{ formatTime(refundDetail.businessAuditTime) }}
              </p>
              <p v-if="refundDetail.businessAuditBy">
                审核人：{{ refundDetail.businessAuditBy }}
              </p>
              <p v-if="refundDetail.businessAuditRemark" class="audit-remark">
                备注：{{ refundDetail.businessAuditRemark }}
              </p>
              <el-tag v-if="refundDetail.status >= 1 || refundDetail.status === 5"
                     :type="refundDetail.status === 5 ? 'danger' : 'success'"
                     size="small">
                {{ refundDetail.status === 5 ? '业务拒绝' : '业务通过' }}
              </el-tag>
              <el-tag v-else type="warning" size="small">待业务审核</el-tag>
            </div>
          </el-timeline-item>

          <!-- 财务审核 -->
          <el-timeline-item
            v-if="refundDetail.status >= 1 && refundDetail.status !== 5"
            timestamp="财务审核"
            :color="getAuditStepColor(1)"
            :icon="getAuditStepIcon(1)"
          >
            <div class="timeline-content">
              <h4>财务审核</h4>
              <p v-if="refundDetail.financeAuditTime">
                {{ formatTime(refundDetail.financeAuditTime) }}
              </p>
              <p v-if="refundDetail.financeAuditBy">
                审核人：{{ refundDetail.financeAuditBy }}
              </p>
              <p v-if="refundDetail.financeAuditRemark" class="audit-remark">
                备注：{{ refundDetail.financeAuditRemark }}
              </p>
              <el-tag v-if="refundDetail.status >= 2 || refundDetail.status === 6"
                     :type="refundDetail.status === 6 ? 'danger' : 'success'"
                     size="small">
                {{ refundDetail.status === 6 ? '财务拒绝' : '财务通过' }}
              </el-tag>
              <el-tag v-else type="warning" size="small">待财务审核</el-tag>
            </div>
          </el-timeline-item>

          <!-- 退款执行 -->
          <el-timeline-item
            v-if="refundDetail.status >= 2 && refundDetail.status !== 5 && refundDetail.status !== 6"
            timestamp="退款执行"
            :color="getExecuteStepColor()"
            :icon="getExecuteStepIcon()"
          >
            <div class="timeline-content">
              <h4>退款执行</h4>
              <p v-if="refundDetail.executeTime">
                {{ formatTime(refundDetail.executeTime) }}
              </p>
              <p v-if="refundDetail.executeBy">
                执行人：{{ refundDetail.executeBy }}
              </p>
              <el-tag :type="getExecuteStatusType()" size="small">
                {{ getExecuteStatusText() }}
              </el-tag>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-card">
        <el-button
          v-if="refundDetail.status === 0"
          type="danger"
          @click="cancelRefund"
        >
          撤销申请
        </el-button>
        <el-button @click="goBack">
          返回列表
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Picture } from '@element-plus/icons-vue'
import { refundApi } from '../api/refund'
import type { RefundRecord } from '../types/refund'
import { formatTime } from '../utils/dateUtils'
import { getRefundImageUrl, getProductImageUrl } from '../utils/imageUtils'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const auditFlowLoading = ref(false)
const refundDetail = ref<RefundRecord | null>(null)

// 页面初始化
onMounted(() => {
  const refundSn = route.params.refundSn as string
  if (refundSn) {
    loadRefundDetail(refundSn)
  } else {
    ElMessage.error('退款单号不能为空')
    goBack()
  }
})

// 加载退款详情
async function loadRefundDetail(refundSn: string) {
  loading.value = true
  try {
    console.log('加载退款详情:', refundSn)
    refundDetail.value = await refundApi.getRefundDetail(refundSn)
    console.log('退款详情:', refundDetail.value)

    // 检查获取到的数据
    if (refundDetail.value) {
      console.log('退款详情数据:')
      console.log('- 退款单号:', refundDetail.value.refundSn)
      console.log('- 退款状态:', refundDetail.value.status, refundDetail.value.statusName)
      console.log('- 退款金额:', refundDetail.value.refundAmount)
      console.log('- 图片数量:', refundDetail.value.images?.length)
      console.log('- 图片列表:', refundDetail.value.images)
    }
  } catch (error: any) {
    console.error('加载退款详情失败:', error)
    ElMessage.error(error.message || '加载退款详情失败')
    goBack()
  } finally {
    loading.value = false
  }
}

// formatTime 函数现在从 utils/dateUtils 导入

// 获取状态类型
function getStatusType(status: number) {
  switch (status) {
    case 0: return 'warning' // 待业务审核
    case 1: return 'primary' // 待财务审核
    case 2: return 'info'    // 处理中
    case 3: return 'success' // 成功
    case 4: return 'danger'  // 失败
    case 5: return 'danger'  // 业务拒绝
    case 6: return 'danger'  // 财务拒绝
    default: return 'info'
  }
}

// 获取状态名称
function getStatusName(status: number) {
  switch (status) {
    case 0: return '待业务审核'
    case 1: return '待财务审核'
    case 2: return '处理中'
    case 3: return '成功'
    case 4: return '失败'
    case 5: return '业务拒绝'
    case 6: return '财务拒绝'
    default: return '未知状态'
  }
}

// 获取退款类型名称
function getRefundTypeName(refundType: string) {
  switch (refundType) {
    case 'BALANCE': return '余额退款'
    case 'ORIGINAL': return '原路退回'
    default: return refundType || '未知类型'
  }
}

// 获取处理文本
function getProcessText(status: number) {
  switch (status) {
    case 1: return '同意退款，处理中'
    case 2: return '退款处理完成'
    case 3: return '退款处理失败'
    case 4: return '拒绝退款申请'
    default: return '处理中'
  }
}



// 图片URL处理函数已移至 utils/imageUtils.ts

// 撤销退款申请
async function cancelRefund() {
  try {
    await ElMessageBox.confirm(
      '确定要撤销这个退款申请吗？撤销后无法恢复。',
      '确认撤销',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // TODO: 调用撤销API
    ElMessage.success('退款申请已撤销')
    goBack()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('撤销失败')
    }
  }
}

// 加载审核流程
async function loadAuditFlow() {
  const refundSn = route.params.refundSn as string
  if (!refundSn) return

  auditFlowLoading.value = true
  try {
    // 这里可以调用审核流程API，暂时使用退款详情数据
    console.log('刷新审核流程')
    await loadRefundDetail(refundSn)
  } catch (error: any) {
    console.error('加载审核流程失败:', error)
    ElMessage.error(error.message || '加载审核流程失败')
  } finally {
    auditFlowLoading.value = false
  }
}

// 获取审核步骤颜色
function getAuditStepColor(step: number) {
  if (!refundDetail.value) return '#e4e7ed'

  switch (step) {
    case 0: // 业务审核
      if (refundDetail.value.status >= 1 || refundDetail.value.status === 5) {
        return refundDetail.value.status === 5 ? '#f56c6c' : '#67c23a'
      }
      return refundDetail.value.status === 0 ? '#e6a23c' : '#e4e7ed'
    case 1: // 财务审核
      if (refundDetail.value.status >= 2 || refundDetail.value.status === 6) {
        return refundDetail.value.status === 6 ? '#f56c6c' : '#67c23a'
      }
      return refundDetail.value.status === 1 ? '#e6a23c' : '#e4e7ed'
    default:
      return '#e4e7ed'
  }
}

// 获取审核步骤图标
function getAuditStepIcon(step: number) {
  if (!refundDetail.value) return 'Clock'

  switch (step) {
    case 0: // 业务审核
      if (refundDetail.value.status >= 1 || refundDetail.value.status === 5) {
        return refundDetail.value.status === 5 ? 'Close' : 'Check'
      }
      return refundDetail.value.status === 0 ? 'Clock' : 'Clock'
    case 1: // 财务审核
      if (refundDetail.value.status >= 2 || refundDetail.value.status === 6) {
        return refundDetail.value.status === 6 ? 'Close' : 'Check'
      }
      return refundDetail.value.status === 1 ? 'Clock' : 'Clock'
    default:
      return 'Clock'
  }
}

// 获取执行步骤颜色
function getExecuteStepColor() {
  if (!refundDetail.value) return '#e4e7ed'

  switch (refundDetail.value.status) {
    case 2: return '#e6a23c' // 处理中
    case 3: return '#67c23a' // 成功
    case 4: return '#f56c6c' // 失败
    default: return '#e4e7ed'
  }
}

// 获取执行步骤图标
function getExecuteStepIcon() {
  if (!refundDetail.value) return 'Clock'

  switch (refundDetail.value.status) {
    case 2: return 'Clock' // 处理中
    case 3: return 'Check' // 成功
    case 4: return 'Close' // 失败
    default: return 'Clock'
  }
}

// 获取执行状态类型
function getExecuteStatusType() {
  if (!refundDetail.value) return 'info'

  switch (refundDetail.value.status) {
    case 2: return 'warning' // 处理中
    case 3: return 'success' // 成功
    case 4: return 'danger'  // 失败
    default: return 'info'
  }
}

// 获取执行状态文本
function getExecuteStatusText() {
  if (!refundDetail.value) return '未知'

  switch (refundDetail.value.status) {
    case 2: return '处理中'
    case 3: return '退款成功'
    case 4: return '退款失败'
    default: return '未知'
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.refund-detail-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.page-title {
  font-size: 20px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-container,
.empty-container {
  background: #fff;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.refund-detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片样式 */
.status-card,
.info-card,
.order-card,
.description-card,
.images-card,
.remark-card,
.timeline-card,
.actions-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 16px 0;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 状态卡片 */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  flex: 1;
}

.refund-sn {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.refund-amount {
  text-align: right;
}

.amount-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.amount-value {
  font-size: 24px;
  color: #ff6700;
  font-weight: 600;
}

/* 商品列表 */
.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px 0;
}

.product-specs {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price {
  color: #e6a23c;
  font-weight: 500;
  font-size: 16px;
}

.quantity {
  color: #666;
  font-size: 14px;
}

/* 描述文本 */
.description-text,
.remark-text {
  line-height: 1.6;
  color: #666;
  margin: 0;
  font-size: 14px;
}

/* 图片列表 */
.images-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.refund-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  cursor: pointer;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f5f5;
  color: #999;
  font-size: 12px;
}

.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

/* 审核流程样式 */
.timeline-content h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.timeline-content p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.audit-remark {
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  margin-top: 8px;
}

/* 金额样式 */
.amount {
  color: #e6a23c;
  font-weight: 500;
  font-size: 16px;
}

/* 操作按钮 */
.actions-card {
  text-align: center;
}

.actions-card .el-button {
  margin: 0 8px;
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .refund-detail-container {
    padding: 10px;
  }

  .page-header {
    padding: 16px;
  }

  .status-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .refund-amount {
    text-align: left;
  }

  .product-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .actions-card .el-button {
    width: 100%;
    margin: 4px 0;
  }
}
</style>
