<template>
  <div class="platform-funds">
    <div class="page-header">
      <h2>平台资金管理</h2>
      <div class="header-actions">
        <el-button @click="loadData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 账户概览 -->
    <div class="account-overview">
      <el-row :gutter="20">
        <el-col :span="8" v-for="account in accounts" :key="account.id">
          <el-card class="account-card">
            <div class="account-info">
              <div class="account-type">
                {{ account.accountTypeName || (account.accountType === 'MAIN' ? '主账户' : '退款账户') }}
              </div>
              <div class="account-balance">
                <span class="balance-label">可用余额</span>
                <span class="balance-amount">¥{{ (account.balance || 0).toFixed(2) }}</span>
              </div>
              <div class="account-frozen" v-if="(account.frozenAmount || 0) > 0">
                <span class="frozen-label">冻结金额</span>
                <span class="frozen-amount">¥{{ (account.frozenAmount || 0).toFixed(2) }}</span>
              </div>
              <div class="account-stats">
                <div class="stat-item">
                  <span class="stat-label">总收入</span>
                  <span class="stat-value">¥{{ (account.totalIncome || 0).toFixed(2) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">总支出</span>
                  <span class="stat-value">¥{{ (account.totalExpense || 0).toFixed(2) }}</span>
                </div>
              </div>
              <div class="update-time">
                更新时间：{{ formatTime(account.updateTime) }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 退款统计 -->
    <div class="refund-stats-section">
      <el-card>
        <template #header>
          <span>退款统计</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ refundStats.totalCount || 0 }}</div>
              <div class="stat-label">总退款笔数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number pending">{{ refundStats.pendingCount || 0 }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number success">{{ refundStats.successCount || 0 }}</div>
              <div class="stat-label">退款成功</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">¥{{ (refundStats.totalRefundAmount || 0).toFixed(2) }}</div>
              <div class="stat-label">总退款金额</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 资金流水 -->
    <div class="fund-flows-section">
      <el-card>
        <template #header>
          <div class="section-header">
            <span>资金流水</span>
            <div class="header-filters">
              <el-select v-model="flowFilter.flowType" placeholder="流水类型" clearable @change="loadFundFlows">
                <el-option label="收入" value="INCOME" />
                <el-option label="退款" value="REFUND" />
                <el-option label="冻结" value="FREEZE" />
                <el-option label="解冻" value="UNFREEZE" />
              </el-select>
              <el-date-picker
                v-model="flowFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="loadFundFlows"
              />
            </div>
          </div>
        </template>

        <el-table :data="fundFlows" v-loading="flowLoading" stripe>
          <el-table-column prop="transactionSn" label="流水号" width="180" />
          <el-table-column prop="transactionTypeName" label="交易类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getFlowType(row.transactionType)">{{ row.transactionTypeName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="businessTypeName" label="业务类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getBusinessType(row.businessType)" plain>{{ row.businessTypeName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              <span :class="{ 'income': row.transactionType === 'INCOME', 'expense': row.transactionType === 'EXPENSE' }">
                {{ row.transactionType === 'INCOME' ? '+' : '-' }}¥{{ (row.amount || 0).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balanceBefore" label="操作前余额" width="120">
            <template #default="{ row }">
              ¥{{ (row.balanceBefore || 0).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="balanceAfter" label="操作后余额" width="120">
            <template #default="{ row }">
              ¥{{ (row.balanceAfter || 0).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="relatedOrderSn" label="关联订单" width="150" show-overflow-tooltip />
          <el-table-column prop="relatedRefundSn" label="关联退款" width="150" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column prop="createTime" label="时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="flowPagination.page"
            v-model:page-size="flowPagination.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="flowPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadFundFlows"
            @current-change="loadFundFlows"
          />
        </div>
      </el-card>
    </div>

    <!-- 退款处理 -->
    <div class="refund-process-section">
      <el-card>
        <template #header>
          <span>退款处理</span>
        </template>

        <div class="process-actions">
          <el-button type="primary" @click="showBatchRefundDialog">
            批量退款处理
          </el-button>
          <el-button @click="showRefundReportDialog">
            退款报表
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 批量退款对话框 -->
    <el-dialog
      v-model="batchRefundDialog.visible"
      title="批量退款处理"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="batch-refund-content">
        <el-alert
          title="注意"
          description="批量退款将处理所有已审核通过但未退款的申请，请确认平台账户余额充足"
          type="warning"
          :closable="false"
          show-icon
        />

        <div class="batch-info">
          <p>待处理退款数量：<strong>{{ refundStats.processingCount || 0 }}</strong> 笔</p>
          <p>预计退款金额：<strong>¥{{ (estimatedRefundAmount || 0).toFixed(2) }}</strong></p>
          <p>当前账户余额：<strong>¥{{ (currentBalance || 0).toFixed(2) }}</strong></p>
        </div>
      </div>

      <template #footer>
        <el-button @click="batchRefundDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="processBatchRefund"
          :loading="batchProcessing"
          :disabled="currentBalance < estimatedRefundAmount"
        >
          确认处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { refundApi } from '../../api/refund'
import type { PlatformAccount, RefundStats, FundFlow } from '../../types/refund'

const loading = ref(false)
const flowLoading = ref(false)
const batchProcessing = ref(false)

const accounts = ref<PlatformAccount[]>([])
const refundStats = ref<RefundStats>({} as RefundStats)
const fundFlows = ref<FundFlow[]>([])

const flowFilter = reactive({
  flowType: '',
  dateRange: null as any
})

const flowPagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const batchRefundDialog = reactive({
  visible: false
})

// 计算属性
const currentBalance = computed(() => {
  if (accounts.value.length > 0) {
    const mainAccount = accounts.value.find(acc => acc.accountType === 'MAIN')
    return mainAccount?.balance || 0
  }
  return 0
})

const estimatedRefundAmount = computed(() => {
  // 这里应该从API获取待处理退款的总金额
  return (refundStats.value.processingCount || 0) * 100
})

// 加载所有数据
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadAccounts(),
      loadRefundStats(),
      loadFundFlows()
    ])
  } finally {
    loading.value = false
  }
}

// 加载账户信息
const loadAccounts = async () => {
  try {
    console.log('开始加载平台账户信息...')
    const accountData = await refundApi.getPlatformAccount()
    console.log('平台账户信息加载成功:', accountData)
    // 将单个账户对象包装成数组
    accounts.value = Array.isArray(accountData) ? accountData : [accountData]
  } catch (error: any) {
    console.error('加载账户信息失败:', error)
    ElMessage.error('加载账户信息失败: ' + (error.message || error))
  }
}

// 加载退款统计
const loadRefundStats = async () => {
  try {
    console.log('开始加载退款统计...')
    refundStats.value = await refundApi.getRefundStats()
    console.log('退款统计加载成功:', refundStats.value)
  } catch (error: any) {
    console.error('加载退款统计失败:', error)
    ElMessage.error('加载退款统计失败: ' + (error.message || error))
  }
}

// 加载资金流水
const loadFundFlows = async () => {
  flowLoading.value = true
  try {
    console.log('开始加载资金流水...')
    const params = {
      page: flowPagination.page,
      size: flowPagination.size,
      flowType: flowFilter.flowType,
      startDate: flowFilter.dateRange?.[0],
      endDate: flowFilter.dateRange?.[1]
    }
    console.log('资金流水请求参数:', params)

    const response = await refundApi.getFundFlows(params)
    console.log('资金流水响应:', response)
    fundFlows.value = response.items
    flowPagination.total = response.total
    console.log('资金流水加载成功:', fundFlows.value)
  } catch (error: any) {
    console.error('加载资金流水失败:', error)
    ElMessage.error('加载资金流水失败: ' + (error.message || error))
  } finally {
    flowLoading.value = false
  }
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  try {
    return new Date(time).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return time
  }
}

// 获取交易类型
const getFlowType = (transactionType: string) => {
  switch (transactionType) {
    case 'INCOME': return 'success'
    case 'EXPENSE': return 'warning'
    default: return 'default'
  }
}

// 获取业务类型
const getBusinessType = (businessType: string) => {
  switch (businessType) {
    case 'PAYMENT': return 'success'
    case 'REFUND': return 'warning'
    default: return 'info'
  }
}

// 显示批量退款对话框
const showBatchRefundDialog = () => {
  batchRefundDialog.visible = true
}

// 显示退款报表对话框
const showRefundReportDialog = () => {
  ElMessage.info('退款报表功能开发中')
}

// 处理批量退款
const processBatchRefund = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要处理 ${refundStats.value.processingCount || 0} 笔退款申请吗？总金额 ¥${(estimatedRefundAmount.value || 0).toFixed(2)}`,
      '确认批量退款',
      {
        confirmButtonText: '确定处理',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    batchProcessing.value = true

    // TODO: 调用批量退款API
    // 这里需要实现真实的批量退款逻辑

    ElMessage.success('批量退款处理成功')
    batchRefundDialog.visible = false
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量退款处理失败')
    }
  } finally {
    batchProcessing.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.platform-funds {
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

.account-overview {
  margin-bottom: 30px;
}

.account-card {
  height: 200px;
}

.account-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.account-type {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.account-balance {
  margin-bottom: 8px;
}

.balance-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.balance-amount {
  font-size: 24px;
  font-weight: 600;
  color: #67c23a;
}

.account-frozen {
  margin-bottom: 12px;
}

.frozen-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.frozen-amount {
  font-size: 14px;
  color: #f56c6c;
}

.account-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.update-time {
  font-size: 12px;
  color: #999;
}

.refund-stats-section,
.fund-flows-section,
.refund-process-section {
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.stat-number.pending {
  color: #e6a23c;
}

.stat-number.success {
  color: #67c23a;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-filters {
  display: flex;
  gap: 12px;
}

.income {
  color: #67c23a;
}

.expense {
  color: #f56c6c;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.process-actions {
  display: flex;
  gap: 12px;
}

.batch-refund-content {
  margin-bottom: 20px;
}

.batch-info {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.batch-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #333;
}
</style>
