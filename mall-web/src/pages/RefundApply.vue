<template>
  <div class="refund-apply-container">
    <div class="page-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="page-title">申请退货</h1>
    </div>

    <div v-if="loading" class="loading-container" v-loading="loading">
      <div style="height: 200px;"></div>
    </div>

    <div v-else-if="!orderDetail" class="empty-container">
      <el-empty description="订单不存在" />
    </div>

    <div v-else class="refund-apply-content">
      <!-- 订单信息 -->
      <div class="order-card">
        <h3 class="card-title">订单信息</h3>
        <div class="order-info">
          <div class="info-item">
            <span class="label">订单号：</span>
            <span class="value">{{ orderDetail.orderSn }}</span>
          </div>
          <div class="info-item">
            <span class="label">订单状态：</span>
            <el-tag :type="getStatusType(orderDetail.status)">{{ orderDetail.statusName }}</el-tag>
          </div>
          <div class="info-item">
            <span class="label">订单金额：</span>
            <span class="value amount">¥{{ orderDetail.payAmount }}</span>
          </div>
        </div>

        <!-- 商品列表 -->
        <div class="product-list">
          <div v-for="item in orderDetail.orderItems" :key="item.id" class="product-item">
            <div class="product-image">
              <img :src="getImageUrl(item.productImage)" :alt="item.productName" />
            </div>
            <div class="product-info">
              <div class="product-name">{{ item.productName }}</div>
              <div class="product-specs">{{ item.specs }}</div>
              <div class="product-price">¥{{ item.price }} x{{ item.quantity }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 退货申请表单 -->
      <div class="refund-form-card">
        <h3 class="card-title">退货信息</h3>
        <el-form :model="refundForm" :rules="refundRules" ref="refundFormRef" label-width="100px">
          <el-form-item label="退款方式" prop="refundType">
            <el-radio-group v-model="refundForm.refundType">
              <el-radio label="BALANCE">退到余额</el-radio>
              <el-radio label="ORIGINAL">原路退回</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="退款原因" prop="reason">
            <el-select v-model="refundForm.reason" placeholder="请选择退款原因" style="width: 100%">
              <el-option label="商品质量问题" value="商品质量问题" />
              <el-option label="商品与描述不符" value="商品与描述不符" />
              <el-option label="收到商品破损" value="收到商品破损" />
              <el-option label="商品缺件少件" value="商品缺件少件" />
              <el-option label="不喜欢/不想要" value="不喜欢/不想要" />
              <el-option label="其他原因" value="其他原因" />
            </el-select>
          </el-form-item>

          <el-form-item label="退款金额" prop="refundAmount">
            <el-input-number
              v-model="refundForm.refundAmount"
              :min="0"
              :max="orderDetail.payAmount"
              :precision="2"
              style="width: 200px"
            />
            <span class="amount-tip">（最多可退 ¥{{ orderDetail.payAmount }}）</span>
          </el-form-item>

          <el-form-item label="问题描述" prop="description">
            <el-input
              v-model="refundForm.description"
              type="textarea"
              :rows="4"
              placeholder="请详细描述遇到的问题，以便我们更好地为您处理"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="联系电话">
            <el-input
              v-model="refundForm.contactPhone"
              placeholder="请输入联系电话（可选）"
              maxlength="11"
            />
          </el-form-item>

          <el-form-item label="上传图片">
            <el-upload
              v-model:file-list="fileList"
              :action="uploadUrl"
              list-type="picture-card"
              :headers="uploadHeaders"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :on-remove="handleFileRemove"
              :before-upload="beforeUpload"
              accept="image/*"
              :limit="6"
              name="file"
            >
              <el-icon><Plus /></el-icon>
              <template #tip>
                <div class="el-upload__tip">
                  支持jpg/png格式，最多上传6张图片，每张不超过2MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <el-button size="large" @click="goBack">取消</el-button>
        <el-button type="primary" size="large" @click="submitRefund" :loading="submitting">
          提交申请
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import { getProductImageUrl } from '../utils/imageUtils'
import { API_BASE_URL } from '../api/config'

const router = useRouter()
const route = useRoute()

// 数据定义
interface OrderDetail {
  id: number
  orderSn: string
  status: number
  statusName: string
  payAmount: number
  orderItems: OrderItem[]
}

interface OrderItem {
  id: number
  productId: number
  productName: string
  productImage: string
  price: number
  quantity: number
  specs: string
}

interface FileUploadVO {
  filename?: string
  relativePath?: string
  fullUrl?: string
  fileSize?: number
  contentType?: string
  uploadTime?: number
}

const loading = ref(false)
const submitting = ref(false)
const orderDetail = ref<OrderDetail | null>(null)
const fileList = ref([])
const refundFormRef = ref()

// 上传相关
const uploadHeaders = ref({
  Authorization: ''
})

// 上传URL
const uploadUrl = ref('')

// 退货申请表单
const refundForm = reactive({
  orderSn: '',
  refundType: 'BALANCE', // 默认余额退款
  reason: '',
  description: '',
  refundAmount: 0,
  images: [] as string[],
  contactPhone: ''
})

// 表单验证规则
const refundRules = {
  refundType: [
    { required: true, message: '请选择退款方式', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请选择退款原因', trigger: 'change' }
  ],
  refundAmount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '退款金额必须大于0', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请描述问题', trigger: 'blur' },
    { min: 10, message: '问题描述至少10个字符', trigger: 'blur' }
  ]
}

// 页面初始化
onMounted(() => {
  // 设置上传头部和URL
  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  if (token) {
    uploadHeaders.value.Authorization = `Bearer ${token}`
  }

  // 设置上传URL - 使用完整URL通过网关
  uploadUrl.value = `${API_BASE_URL}/payment-service/api/v1/refund/upload-image`
  console.log('🔧 设置上传URL:', uploadUrl.value)

  const orderSn = route.query.orderSn as string
  if (orderSn) {
    refundForm.orderSn = orderSn
    loadOrderDetail(orderSn)
  } else {
    ElMessage.error('订单号不能为空')
    goBack()
  }
})

// 加载订单详情
async function loadOrderDetail(orderSn: string) {
  loading.value = true
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')
    if (!token) {
      ElMessage.error('请先登录')
      router.push('/login')
      return
    }

    const response = await axios.get(`/order-service/api/v1/orders/${orderSn}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    orderDetail.value = response.data.data
    refundForm.refundAmount = orderDetail.value.payAmount

    // 检查订单状态是否可以申请退货
    if (orderDetail.value.status < 2) {
      ElMessage.error('订单状态不允许申请退货')
      goBack()
      return
    }
  } catch (error: any) {
    console.error('加载订单详情失败:', error)
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      router.push('/login')
    } else {
      ElMessage.error('加载订单详情失败')
      goBack()
    }
  } finally {
    loading.value = false
  }
}

// 获取状态类型
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

// 获取图片URL - 使用统一的工具函数
function getImageUrl(imagePath: string) {
  return getProductImageUrl(imagePath)
}

// 上传前检查
function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 上传成功处理
function handleUploadSuccess(response: { code: string; data: FileUploadVO; msg?: string }, file: any) {
  console.log('上传成功:', response)
  if (response.code === '000000') {
    // 根据后端返回的数据结构获取图片URL
    let imageUrl = response.data.fullUrl || response.data.relativePath
    if (imageUrl) {
      // 清理图片URL，移除服务前缀，确保存储的是干净的路径
      imageUrl = imageUrl.replace(/\/payment-service\//g, '/')
      console.log('🔧 清理后的图片URL:', imageUrl)

      refundForm.images.push(imageUrl)
      ElMessage.success('图片上传成功')
      console.log('图片URL已添加到表单:', imageUrl)
      console.log('当前图片列表:', refundForm.images)
    } else {
      ElMessage.error('上传响应中缺少图片URL')
    }
  } else {
    ElMessage.error(response.msg || '上传失败')
    // 移除失败的文件
    const index = fileList.value.findIndex((f: any) => f.uid === file.uid)
    if (index > -1) {
      fileList.value.splice(index, 1)
    }
  }
}

// 上传失败处理
function handleUploadError(error: any, file: any) {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败，请重试')
  // 移除失败的文件
  const index = fileList.value.findIndex((f: any) => f.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}

// 处理文件移除
function handleFileRemove(file: any, fileList: any[]) {
  console.log('移除文件:', file)
  // 从表单数据中移除对应的图片URL
  if (file.response?.code === '000000') {
    let imageUrl = file.response.data.fullUrl || file.response.data.relativePath
    // 清理图片URL，确保与存储的格式一致
    imageUrl = imageUrl.replace(/\/payment-service\//g, '/')
    const index = refundForm.images.indexOf(imageUrl)
    if (index > -1) {
      refundForm.images.splice(index, 1)
      console.log('从表单中移除图片URL:', imageUrl)
      console.log('移除后的图片列表:', refundForm.images)
    }
  }
}

// 提交退货申请
async function submitRefund() {
  if (!refundFormRef.value) return

  const valid = await refundFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await ElMessageBox.confirm(
      '确定要提交退货申请吗？提交后将等待商家审核。',
      '确认提交',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    submitting.value = true
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')

    console.log('提交退款申请，表单数据:', refundForm)
    console.log('上传的图片URLs:', refundForm.images)

    await axios.post('/payment-service/api/v1/refund/apply', refundForm, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    ElMessage.success('退货申请提交成功，请等待商家审核')
    // 延迟一下再返回，确保后端数据已更新
    setTimeout(() => {
      router.go(-1)
    }, 1000)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交退货申请失败:', error)
      ElMessage.error(error.response?.data?.msg || '提交退货申请失败')
    }
  } finally {
    submitting.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.refund-apply-container {
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

.refund-apply-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片样式 */
.order-card,
.refund-form-card {
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

/* 订单信息 */
.order-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  color: #666;
  margin-right: 8px;
  min-width: 80px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.info-item .value.amount {
  color: #ff6700;
  font-size: 16px;
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
  background: #fafafa;
  border-radius: 6px;
}

.product-image {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.product-specs {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.product-price {
  font-size: 14px;
  color: #ff6700;
  font-weight: 500;
}

/* 表单样式 */
.amount-tip {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

/* 提交区域 */
.submit-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.submit-section .el-button {
  margin: 0 8px;
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .refund-apply-container {
    padding: 10px;
  }

  .page-header {
    padding: 16px;
  }

  .order-info {
    grid-template-columns: 1fr;
  }

  .product-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .submit-section .el-button {
    width: 100%;
    margin: 4px 0;
  }
}
</style>
