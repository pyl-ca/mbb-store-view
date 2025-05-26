<template>
  <div class="wallet-page">
    <div class="container">
      <!-- 余额卡片 -->
      <div class="balance-card">
        <div class="balance-header">
          <div class="balance-title">
            <i class="icon-wallet"></i>
            我的钱包
          </div>
          <div class="balance-actions">
            <el-button type="primary" size="small" @click="showRechargeDialog = true">
              充值
            </el-button>
            <el-button size="small" @click="showSetPasswordDialog = true" v-if="!hasPayPassword">
              设置支付密码
            </el-button>
          </div>
        </div>

        <div class="balance-content">
          <div class="balance-amount">
            <div class="amount-label">可用余额（元）</div>
            <div class="amount-value">{{ balanceInfo.availableBalance?.toFixed(2) || '0.00' }}</div>
          </div>

          <div class="balance-details">
            <div class="detail-item">
              <span class="label">账户余额</span>
              <span class="value">¥{{ balanceInfo.balance?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">冻结金额</span>
              <span class="value">¥{{ balanceInfo.freezeAmount?.toFixed(2) || '0.00' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能菜单 -->
      <div class="function-menu">
        <div class="menu-item" @click="showRechargeDialog = true">
          <i class="icon-recharge"></i>
          <span>充值</span>
        </div>
        <div class="menu-item" @click="loadAndShowPaymentRecords">
          <i class="icon-record"></i>
          <span>交易记录</span>
        </div>
        <div class="menu-item" @click="loadAndShowRechargeRecords">
          <i class="icon-history"></i>
          <span>充值记录</span>
        </div>
        <div class="menu-item" @click="handlePasswordAction">
          <i class="icon-password"></i>
          <span>{{ hasPayPassword ? '修改' : '设置' }}支付密码</span>
        </div>
      </div>

      <!-- 最近交易 -->
      <div class="recent-transactions" v-if="recentTransactions.length > 0">
        <div class="section-title">最近交易</div>
        <div class="transaction-list">
          <div v-for="transaction in recentTransactions" :key="transaction.id" class="transaction-item">
            <div class="transaction-info">
              <div class="transaction-title">{{ transaction.title }}</div>
              <div class="transaction-time">{{ formatTime(transaction.createTime) }}</div>
            </div>
            <div class="transaction-amount" :class="{ income: transaction.type === 'income' }">
              {{ transaction.type === 'income' ? '+' : '-' }}¥{{ (transaction.amount || 0).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <el-dialog v-model="showRechargeDialog" title="账户充值" width="500px">
      <div class="recharge-dialog">
        <div class="amount-selection">
          <div class="amount-title">选择充值金额</div>
          <div class="amount-options">
            <div
              v-for="amount in rechargeAmounts"
              :key="amount"
              class="amount-option"
              :class="{ active: selectedAmount === amount }"
              @click="selectAmount(amount)"
            >
              ¥{{ amount }}
            </div>
          </div>
          <div class="custom-amount">
            <el-input
              v-model.number="customAmount"
              placeholder="自定义金额"
              type="number"
              :min="1"
              :max="10000"
              @input="selectedAmount = null"
            />
          </div>
        </div>

        <div class="payment-method-selection">
          <div class="method-title">选择支付方式</div>
          <div class="method-options">
            <div
              class="method-option"
              :class="{ active: rechargePayMethod === 'alipay' }"
              @click="rechargePayMethod = 'alipay'"
            >
              <i class="icon-alipay"></i>
              <span>支付宝</span>
            </div>
            <div
              class="method-option"
              :class="{ active: rechargePayMethod === 'wechat' }"
              @click="rechargePayMethod = 'wechat'"
            >
              <i class="icon-wechat"></i>
              <span>微信支付</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showRechargeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleRecharge" :loading="recharging">
          确认充值 ¥{{ (getRechargeAmount() || 0).toFixed(2) }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 设置支付密码弹窗 -->
    <el-dialog v-model="showSetPasswordDialog" title="设置支付密码" width="400px">
      <div class="set-password-dialog">
        <div class="password-tips">
          <p>支付密码用于余额支付时的身份验证</p>
          <p>请设置6位数字密码</p>
        </div>
        <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef">
          <el-form-item prop="payPassword">
            <el-input
              v-model="passwordForm.payPassword"
              type="password"
              placeholder="请输入6位支付密码"
              maxlength="6"
              show-password
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入支付密码"
              maxlength="6"
              show-password
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showSetPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSetPassword" :loading="settingPassword">
          确认设置
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改支付密码弹窗 -->
    <el-dialog v-model="showChangePasswordDialog" title="修改支付密码" width="400px">
      <div class="change-password-dialog">
        <div class="password-tips">
          <p>为了您的账户安全，请先验证原支付密码</p>
        </div>
        <el-form :model="changePasswordForm" :rules="changePasswordRules" ref="changePasswordFormRef">
          <el-form-item prop="oldPassword">
            <el-input
              v-model="changePasswordForm.oldPassword"
              type="password"
              placeholder="请输入原支付密码"
              maxlength="6"
              show-password
            />
          </el-form-item>
          <el-form-item prop="newPassword">
            <el-input
              v-model="changePasswordForm.newPassword"
              type="password"
              placeholder="请输入新支付密码"
              maxlength="6"
              show-password
            />
          </el-form-item>
          <el-form-item prop="confirmNewPassword">
            <el-input
              v-model="changePasswordForm.confirmNewPassword"
              type="password"
              placeholder="请再次输入新支付密码"
              maxlength="6"
              show-password
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showChangePasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 交易记录弹窗 -->
    <el-dialog v-model="showPaymentRecords" title="交易记录" width="600px">
      <div class="records-dialog">
        <div v-if="paymentRecords.length === 0" class="empty-records">
          <p>暂无交易记录</p>
        </div>
        <div v-else class="records-list">
          <div v-for="record in paymentRecords" :key="record.id" class="record-item">
            <div class="record-info">
              <div class="record-title">{{ record.title }}</div>
              <div class="record-time">{{ formatTime(record.createTime) }}</div>
            </div>
            <div class="record-amount" :class="{ income: record.type === 'income' }">
              {{ record.type === 'income' ? '+' : '-' }}¥{{ (record.amount || 0).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 充值记录弹窗 -->
    <el-dialog v-model="showRechargeRecords" title="充值记录" width="600px">
      <div class="records-dialog">
        <div v-if="rechargeRecordsList.length === 0" class="empty-records">
          <p>暂无充值记录</p>
        </div>
        <div v-else class="records-list">
          <div v-for="record in rechargeRecordsList" :key="record.id" class="record-item">
            <div class="record-info">
              <div class="record-title">账户充值</div>
              <div class="record-time">{{ formatTime(record.createTime) }}</div>
            </div>
            <div class="record-amount income">
              +¥{{ (record.amount || 0).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 数据定义
const balanceInfo = ref({})
const hasPayPassword = ref(false)
const recentTransactions = ref([])
const paymentRecords = ref([])
const rechargeRecordsList = ref([])

// 弹窗控制
const showRechargeDialog = ref(false)
const showSetPasswordDialog = ref(false)
const showChangePasswordDialog = ref(false)
const showPaymentRecords = ref(false)
const showRechargeRecords = ref(false)

// 充值相关
const rechargeAmounts = [50, 100, 200, 500, 1000, 2000]
const selectedAmount = ref(null)
const customAmount = ref('')
const rechargePayMethod = ref('alipay')
const recharging = ref(false)

// 设置密码相关
const settingPassword = ref(false)
const passwordForm = reactive({
  payPassword: '',
  confirmPassword: ''
})
const passwordFormRef = ref()

// 修改密码相关
const changingPassword = ref(false)
const changePasswordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: ''
})
const changePasswordFormRef = ref()

const passwordRules = {
  payPassword: [
    { required: true, message: '请输入支付密码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '支付密码必须是6位数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入支付密码', trigger: 'blur' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value !== passwordForm.payPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const changePasswordRules = {
  oldPassword: [
    { required: true, message: '请输入原支付密码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '支付密码必须是6位数字', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新支付密码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '支付密码必须是6位数字', trigger: 'blur' }
  ],
  confirmNewPassword: [
    { required: true, message: '请再次输入新支付密码', trigger: 'blur' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value !== changePasswordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 页面初始化
onMounted(async () => {
  await loadBalanceInfo()
  await checkPayPassword()
  await loadRecentTransactions()
})

// 加载余额信息
async function loadBalanceInfo() {
  try {
    const response = await axios.get(`http://localhost:9999/payment-service/api/v1/balance`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })
    balanceInfo.value = response.data.data
  } catch (error) {
    console.error('加载余额信息失败:', error)
  }
}

// 检查是否设置支付密码
async function checkPayPassword() {
  try {
    const response = await axios.get(`http://localhost:9999/payment-service/api/v1/pay-password/check`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })
    hasPayPassword.value = response.data.data
  } catch (error) {
    console.error('检查支付密码失败:', error)
  }
}

// 加载最近交易记录
async function loadRecentTransactions() {
  try {
    const response = await axios.get(`http://localhost:9999/payment-service/api/v1/payment/records?size=5`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })
    recentTransactions.value = response.data.data.records || []
  } catch (error) {
    console.error('加载交易记录失败:', error)
    recentTransactions.value = []
  }
}

// 选择充值金额
function selectAmount(amount: number) {
  selectedAmount.value = amount
  customAmount.value = ''
}

// 获取充值金额
function getRechargeAmount() {
  return selectedAmount.value || customAmount.value || 0
}

// 处理充值
async function handleRecharge() {
  const amount = getRechargeAmount()
  if (!amount || amount <= 0) {
    ElMessage.warning('请选择或输入充值金额')
    return
  }

  if (!rechargePayMethod.value) {
    ElMessage.warning('请选择支付方式')
    return
  }

  recharging.value = true

  try {
    await axios.post(
      `http://localhost:9999/payment-service/api/v1/recharge`,
      {
        amount: amount,
        payType: rechargePayMethod.value
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
      }
    )

    ElMessage.success('充值成功')
    showRechargeDialog.value = false

    // 重新加载余额信息
    await loadBalanceInfo()
    await loadRecentTransactions()

    // 重置表单
    selectedAmount.value = null
    customAmount.value = ''
  } catch (error) {
    console.error('充值失败:', error)
    ElMessage.error(error.response?.data?.msg || '充值失败')
  } finally {
    recharging.value = false
  }
}

// 处理密码操作（设置或修改）
function handlePasswordAction() {
  if (hasPayPassword.value) {
    // 已有密码，打开修改密码弹窗
    showChangePasswordDialog.value = true
    // 重置修改密码表单
    changePasswordForm.oldPassword = ''
    changePasswordForm.newPassword = ''
    changePasswordForm.confirmNewPassword = ''
  } else {
    // 没有密码，打开设置密码弹窗
    showSetPasswordDialog.value = true
    // 重置设置密码表单
    passwordForm.payPassword = ''
    passwordForm.confirmPassword = ''
  }
}

// 处理设置支付密码
async function handleSetPassword() {
  if (!passwordFormRef.value) return

  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  settingPassword.value = true

  try {
    await axios.post(
      `http://localhost:9999/payment-service/api/v1/pay-password/set`,
      {
        payPassword: passwordForm.payPassword,
        confirmPassword: passwordForm.confirmPassword
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
      }
    )

    ElMessage.success('支付密码设置成功')
    showSetPasswordDialog.value = false
    hasPayPassword.value = true

    // 重置表单
    passwordForm.payPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    console.error('设置支付密码失败:', error)
    ElMessage.error(error.response?.data?.msg || '设置支付密码失败')
  } finally {
    settingPassword.value = false
  }
}

// 处理修改支付密码
async function handleChangePassword() {
  if (!changePasswordFormRef.value) return

  const valid = await changePasswordFormRef.value.validate().catch(() => false)
  if (!valid) return

  changingPassword.value = true

  try {
    await axios.put(
      `http://localhost:9999/payment-service/api/v1/pay-password/update`,
      {
        oldPassword: changePasswordForm.oldPassword,
        newPassword: changePasswordForm.newPassword,
        confirmNewPassword: changePasswordForm.confirmNewPassword
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
      }
    )

    ElMessage.success('支付密码修改成功')
    showChangePasswordDialog.value = false

    // 重置表单
    changePasswordForm.oldPassword = ''
    changePasswordForm.newPassword = ''
    changePasswordForm.confirmNewPassword = ''
  } catch (error: any) {
    console.error('修改支付密码失败:', error)
    ElMessage.error(error.response?.data?.msg || '修改支付密码失败')
  } finally {
    changingPassword.value = false
  }
}

// 加载并显示交易记录
async function loadAndShowPaymentRecords() {
  try {
    const response = await axios.get(`http://localhost:9999/payment-service/api/v1/payment/records`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })
    paymentRecords.value = response.data.data.records || []
    showPaymentRecords.value = true
  } catch (error) {
    console.error('加载交易记录失败:', error)
    paymentRecords.value = []
    showPaymentRecords.value = true
  }
}

// 加载并显示充值记录
async function loadAndShowRechargeRecords() {
  try {
    const response = await axios.get(`http://localhost:9999/payment-service/api/v1/recharge/records`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })
    rechargeRecordsList.value = response.data.data.records || []
    showRechargeRecords.value = true
  } catch (error) {
    console.error('加载充值记录失败:', error)
    rechargeRecordsList.value = []
    showRechargeRecords.value = true
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
.wallet-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 25px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.balance-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.balance-title i {
  margin-right: 8px;
  font-size: 20px;
}

.balance-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.balance-amount {
  flex: 1;
}

.amount-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 5px;
}

.amount-value {
  font-size: 36px;
  font-weight: bold;
}

.balance-details {
  text-align: right;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-item .label {
  opacity: 0.8;
  margin-right: 20px;
}

/* 功能菜单 */
.function-menu {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.menu-item {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.menu-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
}

.menu-item i {
  font-size: 24px;
  color: #409EFF;
  margin-bottom: 8px;
  display: block;
}

.menu-item span {
  font-size: 14px;
  color: #333;
}

/* 最近交易 */
.recent-transactions {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.transaction-time {
  font-size: 12px;
  color: #999;
}

.transaction-amount {
  font-size: 16px;
  font-weight: bold;
  color: #ff4d4f;
}

.transaction-amount.income {
  color: #52c41a;
}

/* 充值弹窗 */
.recharge-dialog {
  padding: 10px 0;
}

.amount-title,
.method-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.amount-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.amount-option {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.amount-option:hover {
  border-color: #409EFF;
}

.amount-option.active {
  border-color: #409EFF;
  background-color: #f0f9ff;
  color: #409EFF;
}

.custom-amount {
  margin-bottom: 20px;
}

.method-options {
  display: flex;
  gap: 15px;
}

.method-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.method-option:hover {
  border-color: #409EFF;
}

.method-option.active {
  border-color: #409EFF;
  background-color: #f0f9ff;
  color: #409EFF;
}

.method-option i {
  margin-right: 8px;
  font-size: 18px;
}

/* 设置密码弹窗 */
.set-password-dialog,
.change-password-dialog {
  padding: 10px 0;
}

.password-tips {
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.password-tips p {
  margin: 0;
  color: #409EFF;
  font-size: 14px;
  line-height: 1.5;
}

/* 记录弹窗 */
.records-dialog {
  max-height: 400px;
  overflow-y: auto;
}

.empty-records {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-amount {
  font-size: 16px;
  font-weight: bold;
  color: #ff4d4f;
}

.record-amount.income {
  color: #52c41a;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .function-menu {
    grid-template-columns: repeat(2, 1fr);
  }

  .amount-options {
    grid-template-columns: repeat(2, 1fr);
  }

  .method-options {
    flex-direction: column;
  }
}
</style>
