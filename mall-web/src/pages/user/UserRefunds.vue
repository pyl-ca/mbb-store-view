<template>
  <div class="user-refunds-container">
    <h2 class="page-title">退款记录</h2>
    <el-divider />

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filter" inline>
        <el-form-item label="退款状态">
          <el-select v-model="filter.status" placeholder="全部状态" clearable @change="loadRefunds" style="width: 150px;">
            <el-option label="待审核" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="成功" :value="2" />
            <el-option label="失败" :value="3" />
            <el-option label="已拒绝" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款类型">
          <el-select v-model="filter.refundType" placeholder="全部类型" clearable @change="loadRefunds" style="width: 150px;">
            <el-option label="余额退款" value="BALANCE" />
            <el-option label="原路退回" value="ORIGINAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input
            v-model="filter.orderSn"
            placeholder="请输入订单号"
            clearable
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

    <!-- 退款列表 -->
    <div class="refunds-list" v-loading="loading">
      <div v-if="refunds.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无退款记录" />
      </div>

      <div v-else class="refund-cards">
        <el-card
          v-for="refund in refunds"
          :key="refund.id"
          class="refund-card"
          shadow="hover"
        >
          <div class="refund-header">
            <div class="refund-info">
              <div class="refund-sn">退款单号：{{ refund.refundSn }}</div>
              <div class="order-sn">订单号：{{ refund.orderSn }}</div>
              <div class="apply-time">申请时间：{{ formatTime(refund.applyTime) }}</div>
            </div>
            <div class="refund-status">
              <el-tag
                :type="getStatusType(refund.status)"
                size="large"
              >
                {{ refund.statusName }}
              </el-tag>
            </div>
          </div>

          <div class="refund-content">
            <div v-if="refund.orderInfo?.orderItems?.length" class="product-list">
              <div
                v-for="item in refund.orderInfo.orderItems"
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
                      <span>图片加载失败</span>
                    </div>
                  </template>
                </el-image>
                <div class="product-details">
                  <h4 class="product-name">{{ item.productName }}</h4>
                  <p class="product-specs">{{ item.specs }}</p>
                  <div class="product-price">
                    <span class="price">¥{{ item.price.toFixed(2) }}</span>
                    <span class="quantity">x{{ item.quantity }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 如果没有订单商品信息，显示基本信息 -->
            <div v-else class="order-basic-info">
              <div class="info-item">
                <span class="label">关联订单：</span>
                <span class="value">{{ refund.orderSn }}</span>
              </div>
            </div>

            <div class="refund-details">
              <div class="detail-row">
                <span class="label">退款类型：</span>
                <span class="value">{{ refund.refundTypeName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">退款原因：</span>
                <span class="value">{{ refund.reason || refund.refundReason || '未填写' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">退款金额：</span>
                <span class="value amount">¥{{ refund.refundAmount?.toFixed(2) || '0.00' }}</span>
              </div>
              <div class="detail-row" v-if="refund.description || refund.refundDescription">
                <span class="label">问题描述：</span>
                <span class="value">{{ refund.description || refund.refundDescription }}</span>
              </div>
              <div class="detail-row" v-if="refund.processRemark">
                <span class="label">处理备注：</span>
                <span class="value">{{ refund.processRemark }}</span>
              </div>
            </div>

            <!-- 退款图片 -->
            <div v-if="refund.images?.length > 0" class="refund-images">
              <div class="images-title">问题图片：</div>
              <div class="images-list">
                <el-image
                  v-for="(image, index) in refund.images"
                  :key="index"
                  :src="getRefundImageUrl(image)"
                  :preview-src-list="refund.images?.map(img => getRefundImageUrl(img))"
                  :initial-index="index"
                  fit="cover"
                  class="refund-image"
                  lazy
                >
                  <template #error>
                    <div class="image-error">
                      <span>图片加载失败</span>
                    </div>
                  </template>
                </el-image>
              </div>
            </div>
          </div>

          <div class="refund-timeline" v-if="refund.status > 0">
            <div class="timeline-title">退款进度</div>
            <el-timeline>
              <el-timeline-item
                timestamp="申请退款"
                :color="refund.status >= 0 ? '#67c23a' : '#e4e7ed'"
              >
                {{ formatTime(refund.applyTime || refund.createTime) }} 提交退款申请
              </el-timeline-item>
              <el-timeline-item
                v-if="refund.processTime"
                timestamp="审核处理"
                :color="refund.status >= 1 ? '#67c23a' : refund.status === 2 ? '#f56c6c' : '#e4e7ed'"
              >
                {{ formatTime(refund.processTime) }}
                {{ refund.status === 1 ? '同意退款' : refund.status === 2 ? '拒绝退款' : '处理中' }}
              </el-timeline-item>
              <el-timeline-item
                v-if="refund.refundTime"
                timestamp="退款完成"
                :color="refund.status === 4 ? '#67c23a' : refund.status === 5 ? '#f56c6c' : '#e4e7ed'"
              >
                {{ formatTime(refund.refundTime) }}
                {{ refund.status === 4 ? '退款成功' : '退款失败' }}
              </el-timeline-item>
            </el-timeline>
          </div>

          <div class="refund-actions">
            <el-button
              size="small"
              @click="viewRefundDetail(refund)"
            >
              查看详情
            </el-button>
            <el-button
              v-if="refund.status === 0"
              type="danger"
              size="small"
              @click="cancelRefund(refund)"
            >
              撤销申请
            </el-button>
          </div>
        </el-card>
      </div>
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
      <div v-if="detailDialog.refund" class="refund-detail-content">
        <!-- 详情内容 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="退款单号">{{ detailDialog.refund.refundSn }}</el-descriptions-item>
            <el-descriptions-item label="订单号">{{ detailDialog.refund.orderSn }}</el-descriptions-item>
            <el-descriptions-item label="退款类型">{{ detailDialog.refund.refundTypeName }}</el-descriptions-item>
            <el-descriptions-item label="退款状态">
              <el-tag :type="getStatusType(detailDialog.refund.status)">
                {{ detailDialog.refund.statusName }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="退款金额">
              <span class="amount">¥{{ detailDialog.refund.refundAmount.toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatTime(detailDialog.refund.applyTime) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section" v-if="detailDialog.refund.refundDescription">
          <h4>问题描述</h4>
          <p>{{ detailDialog.refund.refundDescription }}</p>
        </div>

        <div class="detail-section" v-if="detailDialog.refund.processRemark">
          <h4>处理备注</h4>
          <p>{{ detailDialog.refund.processRemark }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { refundApi } from '../../api/refund'
import type { RefundRecord, RefundFilter } from '../../types/refund'
import { formatTime } from '../../utils/dateUtils'
import { getProductImageUrl, getRefundImageUrl } from '../../utils/imageUtils'

const router = useRouter()
const loading = ref(false)
const refunds = ref<RefundRecord[]>([])
const total = ref(0)

const filter = reactive<RefundFilter>({
  page: 1,
  pageSize: 10
})

const detailDialog = reactive({
  visible: false,
  refund: null as RefundRecord | null
})

// 加载退款列表
const loadRefunds = async () => {
  loading.value = true
  try {
    console.log('开始加载退款记录，参数:', filter)
    const response = await refundApi.getUserRefundList(filter)
    console.log('退款记录响应:', response)
    refunds.value = response.items || response.records || []
    total.value = response.total || 0
    console.log('设置退款记录:', refunds.value)
  } catch (error: any) {
    console.error('加载退款记录失败:', error)
    ElMessage.error(error.message || '加载退款记录失败')
  } finally {
    loading.value = false
  }
}

// formatTime 函数现在从 utils/dateUtils 导入

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

// 查看退款详情
const viewRefundDetail = (refund: RefundRecord) => {
  // 跳转到退款详情页面
  router.push(`/refund/detail/${refund.refundSn}`)
}

// 撤销退款申请
const cancelRefund = async (refund: RefundRecord) => {
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
    loadRefunds()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('撤销失败')
    }
  }
}

onMounted(() => {
  loadRefunds()
})
</script>

<style scoped>
.user-refunds-container {
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

.refunds-list {
  min-height: 400px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.refund-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.refund-card .refund-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.refund-info {
  flex: 1;
}

.refund-sn {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.order-sn, .apply-time {
  font-size: 14px;
  color: #666;
  margin-bottom: 2px;
}

.refund-content {
  margin-bottom: 16px;
}

.order-basic-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.order-basic-info .info-item {
  display: flex;
  align-items: center;
}

.order-basic-info .label {
  width: 80px;
  color: #666;
  font-size: 14px;
  flex-shrink: 0;
}

.order-basic-info .value {
  flex: 1;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.product-list {
  margin-bottom: 16px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
}

.product-specs {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px 0;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price {
  color: #e6a23c;
  font-weight: 500;
}

.quantity {
  color: #666;
  font-size: 12px;
}

.refund-details {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  width: 80px;
  color: #666;
  font-size: 14px;
  flex-shrink: 0;
}

.value {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.value.amount {
  color: #e6a23c;
  font-weight: 500;
}

.refund-images {
  margin-bottom: 16px;
}

.images-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
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

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f5f5;
  color: #999;
  font-size: 12px;
}

.refund-timeline {
  margin-bottom: 16px;
}

.timeline-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.refund-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.pagination {
  margin-top: 30px;
  text-align: center;
}

.refund-detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section p {
  line-height: 1.6;
  color: #666;
  margin: 0;
}
</style>
