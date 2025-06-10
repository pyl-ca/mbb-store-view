<template>
  <div class="create-review-container">
    <div class="page-header">
      <h2>发表评价</h2>
      <el-button @click="goBack" type="text">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div v-loading="loading" class="review-form-card">
      <!-- 订单信息 -->
      <div class="order-info" v-if="orderInfo">
        <h3>订单信息</h3>
        <div class="order-details">
          <span class="order-sn">订单号：{{ orderInfo.orderSn }}</span>
          <span class="order-time">下单时间：{{ formatTime(orderInfo.createTime) }}</span>
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="products-section" v-if="products.length > 0">
        <h3>评价商品</h3>
        <div class="product-list">
          <div 
            v-for="product in products" 
            :key="product.id"
            class="product-item"
            :class="{ 'active': selectedProduct?.id === product.id }"
            @click="selectProduct(product)"
          >
            <el-image
              :src="getProductImage(product.image)"
              fit="cover"
              class="product-image"
            />
            <div class="product-info">
              <h4 class="product-name">{{ product.name }}</h4>
              <p class="product-specs" v-if="product.specInfo">{{ product.specInfo }}</p>
              <div class="product-price">
                <span class="price">¥{{ product.price }}</span>
                <span class="quantity">x{{ product.quantity }}</span>
              </div>
            </div>
            <div class="select-indicator" v-if="selectedProduct?.id === product.id">
              <el-icon><Check /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 评价表单 -->
      <div class="review-form" v-if="selectedProduct">
        <el-form :model="reviewForm" :rules="reviewRules" ref="reviewFormRef" label-width="80px">
          <!-- 评分 -->
          <el-form-item label="商品评分" prop="rating">
            <div class="rating-section">
              <el-rate
                v-model="reviewForm.rating"
                :max="5"
                show-text
                :texts="['非常不满意', '不满意', '一般', '满意', '非常满意']"
                size="large"
              />
            </div>
          </el-form-item>

          <!-- 评价内容 -->
          <el-form-item label="评价内容" prop="content">
            <el-input
              v-model="reviewForm.content"
              type="textarea"
              :rows="4"
              placeholder="请分享您对商品的使用感受，帮助其他买家更好地了解商品"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <!-- 评价标签 -->
          <el-form-item label="评价标签">
            <div class="tags-section">
              <el-checkbox-group v-model="reviewForm.tagIds">
                <el-checkbox
                  v-for="tag in availableTags"
                  :key="tag.id"
                  :label="tag.id"
                  :value="tag.id"
                >
                  {{ tag.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-form-item>

          <!-- 上传图片 -->
          <el-form-item label="上传图片">
            <div class="upload-section">
              <el-upload
                v-model:file-list="fileList"
                :action="uploadUrl"
                :headers="uploadHeaders"
                list-type="picture-card"
                :on-success="handleUploadSuccess"
                :on-error="handleUploadError"
                :on-remove="handleRemoveImage"
                :before-upload="beforeUpload"
                :limit="9"
                accept="image/*"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">最多上传9张图片，支持jpg、png格式</div>
            </div>
          </el-form-item>

          <!-- 匿名评价 -->
          <el-form-item label="匿名评价">
            <el-checkbox v-model="reviewForm.isAnonymous">
              匿名发表评价（其他用户将看不到您的用户名）
            </el-checkbox>
          </el-form-item>

          <!-- 提交按钮 -->
          <el-form-item>
            <div class="form-actions">
              <el-button @click="goBack">取消</el-button>
              <el-button type="primary" @click="submitReview" :loading="submitting">
                发表评价
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 选择商品提示 -->
      <div v-else-if="products.length > 0" class="select-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>请先选择要评价的商品</span>
      </div>

      <!-- 无商品提示 -->
      <div v-else class="empty-tip">
        <el-icon><WarningFilled /></el-icon>
        <span>该订单暂无可评价的商品</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type UploadFile } from 'element-plus'
import { ArrowLeft, Check, Plus, InfoFilled, WarningFilled } from '@element-plus/icons-vue'
import axios from 'axios'
import { reviewApi } from '../api/review'
import { API_ENDPOINTS } from '../api/config'
import type { CreateReviewRequest, ReviewTag } from '../types/review'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const reviewFormRef = ref<FormInstance>()

// 订单和商品信息
const orderInfo = ref<any>(null)
const products = ref<any[]>([])
const selectedProduct = ref<any>(null)

// 评价表单
const reviewForm = reactive<CreateReviewRequest>({
  productId: 0,
  productName: '',
  productImage: '',
  productSpec: '',
  skuId: 0,
  orderId: 0,
  orderSn: '',
  userNickname: '',
  userAvatar: '',
  rating: 5,
  content: '',
  images: [],
  tagIds: [],
  isAnonymous: false,
  specInfo: ''
})

// 表单验证规则
const reviewRules = {
  rating: [
    { required: true, message: '请选择评分', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入评价内容', trigger: 'blur' },
    { min: 10, message: '评价内容至少10个字符', trigger: 'blur' }
  ]
}

// 可用标签
const availableTags = ref<ReviewTag[]>([])

// 文件上传
const fileList = ref<UploadFile[]>([])
const uploadUrl = `${API_ENDPOINTS.REVIEW_SERVICE.BASE}${API_ENDPOINTS.REVIEW_SERVICE.UPLOAD_IMAGE}`
const uploadHeaders = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'X-User-Id': localStorage.getItem('userId') || ''
}

// 页面初始化
onMounted(async () => {
  const orderSn = route.query.orderSn as string
  if (!orderSn) {
    ElMessage.error('缺少订单信息')
    goBack()
    return
  }

  // 设置用户信息
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  reviewForm.userNickname = userInfo.nickname || userInfo.username || ''
  reviewForm.userAvatar = userInfo.avatar || ''

  await loadOrderInfo(orderSn)
  await loadAvailableTags()
})

// 加载订单信息
const loadOrderInfo = async (orderSn: string) => {
  loading.value = true
  try {
    // 获取订单详情
    const response = await axios.get(`/order-service/api/v1/orders/${orderSn}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-User-Id': localStorage.getItem('userId') || ''
      }
    })
    const orderResponse = response.data.data
    orderInfo.value = orderResponse

    // 提取商品信息
    if (orderResponse.orderItems && Array.isArray(orderResponse.orderItems) && orderResponse.orderItems.length > 0) {
      console.log('订单商品原始数据:', orderResponse.orderItems)
      products.value = orderResponse.orderItems.map((item: any) => {
        console.log('处理商品:', {
          productId: item.productId,
          productName: item.productName,
          specs: item.specs,
          specInfo: item.specInfo,
          productSpec: item.productSpec
        })
        return {
          id: item.productId,
          skuId: item.skuId,
          name: item.productName,
          image: item.productImage,
          price: item.price,
          quantity: item.quantity,
          specInfo: item.specs || item.specInfo || item.productSpec || '' // 尝试多个可能的字段
        }
      })
    } else {
      products.value = []
      ElMessage.warning('订单中没有可评价的商品')
    }

    // 设置表单基础信息
    reviewForm.orderId = orderResponse.id
    reviewForm.orderSn = orderSn
  } catch (error: any) {
    ElMessage.error(error.message || '加载订单信息失败')
  } finally {
    loading.value = false
  }
}

// 加载可用标签
const loadAvailableTags = async () => {
  try {
    availableTags.value = await reviewApi.getEnabledTags()
  } catch (error) {
    console.error('加载标签失败:', error)
    ElMessage.warning('加载评价标签失败，您仍可以正常发表评价')
    availableTags.value = []
  }
}

// 选择商品
const selectProduct = (product: any) => {
  selectedProduct.value = product
  reviewForm.productId = product.id
  reviewForm.productName = product.name
  reviewForm.productImage = product.image
  reviewForm.skuId = product.skuId

  // 生成商品规格字符串（按照文档格式："颜色:深空黑色,存储容量:128GB"）
  if (product.specInfo) {
    try {
      // 如果是字符串，尝试解析为JSON
      if (typeof product.specInfo === 'string') {
        const parsed = JSON.parse(product.specInfo)
        if (Array.isArray(parsed)) {
          // 如果是数组格式，转换为字符串格式
          reviewForm.productSpec = parsed.map((spec: any) => `${spec.specName}:${spec.specValue}`).join(',')
        } else {
          reviewForm.productSpec = product.specInfo
        }
        reviewForm.specInfo = JSON.stringify(parsed)
      } else {
        // 如果是对象，直接序列化
        reviewForm.specInfo = JSON.stringify(product.specInfo)
        reviewForm.productSpec = product.specInfo
      }
    } catch (error) {
      // 如果解析失败，直接使用原始字符串
      reviewForm.specInfo = product.specInfo
      reviewForm.productSpec = product.specInfo
    }
  } else {
    reviewForm.specInfo = ''
    reviewForm.productSpec = ''
  }
}

// 获取商品图片
const getProductImage = (image: string) => {
  if (!image) return '/images/placeholder.jpg'
  if (image.startsWith('http')) return image
  // 修正图片路径：使用正确的静态资源路径
  return `/static${image}`
}

// 文件上传成功
const handleUploadSuccess = (response: any) => {
  console.log('上传响应:', response)
  if (response.code === '000000') {
    reviewForm.images.push(response.data.url)
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

// 文件上传失败
const handleUploadError = (error: any) => {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败，请重试')
}

// 移除图片
const handleRemoveImage = (file: UploadFile) => {
  const index = reviewForm.images.findIndex(url => url.includes(file.name))
  if (index > -1) {
    reviewForm.images.splice(index, 1)
  }
}

// 上传前检查
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB!')
    return false
  }
  return true
}

// 提交评价
const submitReview = async () => {
  if (!reviewFormRef.value) return
  
  try {
    await reviewFormRef.value.validate()
    
    if (!selectedProduct.value) {
      ElMessage.error('请选择要评价的商品')
      return
    }

    submitting.value = true

    // 调试信息：打印提交的数据
    console.log('提交评价数据:', JSON.stringify(reviewForm, null, 2))
    console.log('商品信息检查:')
    console.log('- productName:', reviewForm.productName)
    console.log('- productImage:', reviewForm.productImage)
    console.log('- productSpec:', reviewForm.productSpec)
    console.log('- specInfo:', reviewForm.specInfo)

    const result = await reviewApi.createReview(reviewForm)
    console.log('评价创建结果:', result)

    ElMessage.success('评价发表成功，等待审核')

    // 评价成功后跳转回订单页面，这样订单状态会更新，不会再显示"去评价"按钮
    router.push('/user/orders')
  } catch (error: any) {
    ElMessage.error(error.message || '发表评价失败')
  } finally {
    submitting.value = false
  }
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 返回
const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.create-review-container {
  max-width: 800px;
  margin: 0 auto;
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

.review-form-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.order-info {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.order-info h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.order-details {
  display: flex;
  gap: 24px;
  color: #666;
  font-size: 14px;
}

.products-section {
  margin-bottom: 24px;
}

.products-section h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.product-item:hover {
  border-color: #409eff;
}

.product-item.active {
  border-color: #409eff;
  background: #f0f8ff;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
}

.product-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.product-specs {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #999;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price {
  color: #ff6700;
  font-weight: 500;
}

.quantity {
  color: #999;
  font-size: 12px;
}

.select-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
}

.rating-section {
  display: flex;
  align-items: center;
}

.tags-section .el-checkbox {
  margin-right: 16px;
  margin-bottom: 8px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.select-tip,
.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #999;
  font-size: 14px;
}
</style>
