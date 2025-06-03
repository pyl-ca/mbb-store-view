<template>
  <div class="refund-stats-page">
    <div class="page-header">
      <h2>退款统计</h2>
      <el-button @click="loadStats" icon="Refresh">刷新数据</el-button>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else class="stats-content">
      <!-- 总体统计 -->
      <el-card class="stats-card" shadow="hover">
        <template #header>
          <span class="card-title">总体统计</span>
        </template>
        
        <div class="stats-grid">
          <div class="stat-item total">
            <div class="stat-value">{{ stats.totalCount }}</div>
            <div class="stat-label">总退款数量</div>
            <div class="stat-amount">¥{{ formatAmount(stats.totalAmount) }}</div>
          </div>
        </div>
      </el-card>

      <!-- 审核状态统计 -->
      <el-card class="stats-card" shadow="hover">
        <template #header>
          <span class="card-title">审核状态统计</span>
        </template>
        
        <div class="stats-grid">
          <div class="stat-item pending-business">
            <div class="stat-value">{{ stats.pendingBusinessAuditCount }}</div>
            <div class="stat-label">待业务审核</div>
            <div class="stat-amount">¥{{ formatAmount(stats.pendingBusinessAuditAmount) }}</div>
          </div>
          
          <div class="stat-item pending-finance">
            <div class="stat-value">{{ stats.pendingFinanceAuditCount }}</div>
            <div class="stat-label">待财务审核</div>
            <div class="stat-amount">¥{{ formatAmount(stats.pendingFinanceAuditAmount) }}</div>
          </div>
          
          <div class="stat-item processing">
            <div class="stat-value">{{ stats.processingCount }}</div>
            <div class="stat-label">处理中</div>
            <div class="stat-amount">¥{{ formatAmount(stats.processingAmount) }}</div>
          </div>
        </div>
      </el-card>

      <!-- 完成状态统计 -->
      <el-card class="stats-card" shadow="hover">
        <template #header>
          <span class="card-title">完成状态统计</span>
        </template>
        
        <div class="stats-grid">
          <div class="stat-item success">
            <div class="stat-value">{{ stats.successCount }}</div>
            <div class="stat-label">退款成功</div>
            <div class="stat-amount">¥{{ formatAmount(stats.successAmount) }}</div>
          </div>
          
          <div class="stat-item failed">
            <div class="stat-value">{{ stats.failedCount }}</div>
            <div class="stat-label">退款失败</div>
            <div class="stat-amount">¥{{ formatAmount(stats.failedAmount) }}</div>
          </div>
        </div>
      </el-card>

      <!-- 拒绝状态统计 -->
      <el-card class="stats-card" shadow="hover">
        <template #header>
          <span class="card-title">拒绝状态统计</span>
        </template>
        
        <div class="stats-grid">
          <div class="stat-item business-rejected">
            <div class="stat-value">{{ stats.businessRejectedCount }}</div>
            <div class="stat-label">业务拒绝</div>
            <div class="stat-amount">¥{{ formatAmount(stats.businessRejectedAmount) }}</div>
          </div>
          
          <div class="stat-item finance-rejected">
            <div class="stat-value">{{ stats.financeRejectedCount }}</div>
            <div class="stat-label">财务拒绝</div>
            <div class="stat-amount">¥{{ formatAmount(stats.financeRejectedAmount) }}</div>
          </div>
        </div>
      </el-card>

      <!-- 图表展示 -->
      <el-card class="stats-card chart-card" shadow="hover">
        <template #header>
          <span class="card-title">状态分布图</span>
        </template>
        
        <div class="chart-container">
          <div class="chart-item">
            <div class="chart-label">待业务审核</div>
            <el-progress 
              :percentage="getPercentage(stats.pendingBusinessAuditCount)" 
              :color="'#e6a23c'"
              :show-text="false"
            />
            <span class="chart-value">{{ stats.pendingBusinessAuditCount }}</span>
          </div>
          
          <div class="chart-item">
            <div class="chart-label">待财务审核</div>
            <el-progress 
              :percentage="getPercentage(stats.pendingFinanceAuditCount)" 
              :color="'#409eff'"
              :show-text="false"
            />
            <span class="chart-value">{{ stats.pendingFinanceAuditCount }}</span>
          </div>
          
          <div class="chart-item">
            <div class="chart-label">处理中</div>
            <el-progress 
              :percentage="getPercentage(stats.processingCount)" 
              :color="'#909399'"
              :show-text="false"
            />
            <span class="chart-value">{{ stats.processingCount }}</span>
          </div>
          
          <div class="chart-item">
            <div class="chart-label">退款成功</div>
            <el-progress 
              :percentage="getPercentage(stats.successCount)" 
              :color="'#67c23a'"
              :show-text="false"
            />
            <span class="chart-value">{{ stats.successCount }}</span>
          </div>
          
          <div class="chart-item">
            <div class="chart-label">退款失败</div>
            <el-progress 
              :percentage="getPercentage(stats.failedCount)" 
              :color="'#f56c6c'"
              :show-text="false"
            />
            <span class="chart-value">{{ stats.failedCount }}</span>
          </div>
          
          <div class="chart-item">
            <div class="chart-label">业务拒绝</div>
            <el-progress 
              :percentage="getPercentage(stats.businessRejectedCount)" 
              :color="'#f56c6c'"
              :show-text="false"
            />
            <span class="chart-value">{{ stats.businessRejectedCount }}</span>
          </div>
          
          <div class="chart-item">
            <div class="chart-label">财务拒绝</div>
            <el-progress 
              :percentage="getPercentage(stats.financeRejectedCount)" 
              :color="'#f56c6c'"
              :show-text="false"
            />
            <span class="chart-value">{{ stats.financeRejectedCount }}</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { refundApi } from '../../api/refund'
import type { RefundStats } from '../../types/refund'

const loading = ref(false)
const stats = ref<RefundStats>({
  totalCount: 0,
  totalAmount: 0,
  pendingBusinessAuditCount: 0,
  pendingBusinessAuditAmount: 0,
  pendingFinanceAuditCount: 0,
  pendingFinanceAuditAmount: 0,
  processingCount: 0,
  processingAmount: 0,
  successCount: 0,
  successAmount: 0,
  failedCount: 0,
  failedAmount: 0,
  businessRejectedCount: 0,
  businessRejectedAmount: 0,
  financeRejectedCount: 0,
  financeRejectedAmount: 0
})

// 页面初始化
onMounted(() => {
  loadStats()
})

// 加载统计数据
async function loadStats() {
  loading.value = true
  try {
    stats.value = await refundApi.getRefundStats()
  } catch (error: any) {
    console.error('加载统计数据失败:', error)
    ElMessage.error(error.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

// 格式化金额
function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

// 计算百分比
function getPercentage(count: number): number {
  if (stats.value.totalCount === 0) return 0
  return Math.round((count / stats.value.totalCount) * 100)
}
</script>

<style scoped>
.refund-stats-page {
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

.loading-container {
  padding: 40px;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-card {
  border-radius: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.stat-item.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-item.pending-business {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.stat-item.pending-finance {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.stat-item.processing {
  background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
}

.stat-item.success {
  background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
}

.stat-item.failed {
  background: linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%);
}

.stat-item.business-rejected,
.stat-item.finance-rejected {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  margin-bottom: 4px;
  opacity: 0.8;
}

.stat-amount {
  font-size: 16px;
  font-weight: 600;
}

.chart-card {
  margin-top: 20px;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chart-label {
  min-width: 100px;
  font-size: 14px;
  color: #666;
}

.chart-value {
  min-width: 40px;
  text-align: right;
  font-weight: 600;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .refund-stats-page {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .chart-label {
    min-width: auto;
  }
}
</style>
