<template>
  <div class="review-form">
    <el-dialog
      v-model="visible"
      title="发表评价"
      width="600px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
        label-position="top"
      >
        <!-- 商品信息 -->
        <div class="product-info" v-if="productInfo">
          <el-image
            :src="productInfo.image"
            fit="cover"
            class="product-image"
          />
          <div class="product-details">
            <h4 class="product-name">{{ productInfo.name }}</h4>
            <p class="product-specs" v-if="productInfo.specs">{{ productInfo.specs }}</p>
          </div>
        </div>

        <!-- 评分 -->
        <el-form-item label="商品评分" prop="rating" required>
          <div class="rating-section">
            <el-rate
              v-model="formData.rating"
              :colors="['#F7BA2A', '#F7BA2A', '#F7BA2A']"
              show-text
              :texts="['非常差', '差', '一般', '好', '非常好']"
              size="large"
            />
            <span class="rating-desc">{{ getRatingDesc(formData.rating) }}</span>
          </div>
        </el-form-item>

        <!-- 评价内容 -->
        <el-form-item label="评价内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="4"
            placeholder="请分享您的使用感受，帮助其他买家更好地了解商品"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 评价标签 -->
        <el-form-item label="评价标签">
          <div class="tags-section">
            <el-tag
              v-for="tag in availableTags"
              :key="tag.id"
              :type="formData.tagIds.includes(tag.id) ? getTagType(tag.type) : 'info'"
              :effect="formData.tagIds.includes(tag.id) ? 'dark' : 'plain'"
              class="tag-item"
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </el-form-item>

        <!-- 上传图片 -->
        <el-form-item label="上传图片">
          <el-upload
            v-model:file-list="fileList"
            :action="uploadAction"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :on-remove="handleRemoveImage"
            :before-upload="beforeUpload"
            list-type="picture-card"
            :limit="6"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="upload-tip">
                最多上传6张图片，支持jpg、png格式，单张不超过5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 匿名评价 -->
        <el-form-item>
          <el-checkbox v-model="formData.isAnonymous">
            匿名评价（其他用户将看不到您的用户名）
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSubmit"
            :loading="submitting"
          >
            发布评价
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { reviewApi } from '../api/review'
import type { ReviewFormData, CreateReviewRequest, ReviewTag } from '../types/review'

interface Props {
  modelValue: boolean
  productInfo?: {
    id: number
    name: string
    image: string
    specs?: string
  }
  orderInfo?: {
    id: number
    orderSn: string
  }
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const submitting = ref(false)
const fileList = ref([])
const availableTags = ref<ReviewTag[]>([])

const formData = reactive<ReviewFormData>({
  rating: 5,
  content: '',
  images: [],
  isAnonymous: false,
  tagIds: []
})

const rules = {
  rating: [
    { required: true, message: '请选择评分', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入评价内容', trigger: 'blur' },
    { min: 10, message: '评价内容至少10个字符', trigger: 'blur' }
  ]
}

// 上传配置
const uploadAction = computed(() => {
  return '/review-service/api/v1/upload/review-image'
})

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  const userId = localStorage.getItem('userId')
  return {
    Authorization: `Bearer ${token}`,
    'X-User-Id': userId || ''
  }
})

// 获取评分描述
const getRatingDesc = (rating: number) => {
  const descs = ['', '非常差', '差', '一般', '好', '非常好']
  return descs[rating] || ''
}

// 加载可用标签
const loadTags = async () => {
  try {
    availableTags.value = await reviewApi.getEnabledTags()
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

// 切换标签选择
const toggleTag = (tagId: number) => {
  const index = formData.tagIds.indexOf(tagId)
  if (index > -1) {
    formData.tagIds.splice(index, 1)
  } else {
    formData.tagIds.push(tagId)
  }
}

// 获取标签类型
const getTagType = (type: number) => {
  switch (type) {
    case 1: return 'success'
    case 2: return 'danger'
    case 3: return 'info'
    default: return 'info'
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
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = (response: any, file: any) => {
  if (response.code === '000000') {
    formData.images.push(response.data.url)
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
    // 移除失败的文件
    const index = fileList.value.findIndex(item => item.uid === file.uid)
    if (index > -1) {
      fileList.value.splice(index, 1)
    }
  }
}

// 上传失败
const handleUploadError = (error: any, file: any) => {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败')
  // 移除失败的文件
  const index = fileList.value.findIndex(item => item.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}

// 移除图片
const handleRemoveImage = (file: any) => {
  // 从formData.images中移除对应的URL
  if (file.response && file.response.code === '000000') {
    const url = file.response.data.url
    const index = formData.images.indexOf(url)
    if (index > -1) {
      formData.images.splice(index, 1)
    }
  }
}

// 提交评价
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    if (!props.productInfo || !props.orderInfo) {
      ElMessage.error('缺少必要的商品或订单信息')
      return
    }

    submitting.value = true

    const reviewData: CreateReviewRequest = {
      productId: props.productInfo.id,
      orderId: props.orderInfo.id,
      orderSn: props.orderInfo.orderSn,
      rating: formData.rating,
      content: formData.content,
      images: formData.images,
      isAnonymous: formData.isAnonymous,
      specInfo: props.productInfo.specs,
      tagIds: formData.tagIds
    }

    await reviewApi.createReview(reviewData)
    
    ElMessage.success('评价发布成功')
    emit('success')
    handleClose()
    
  } catch (error: any) {
    ElMessage.error(error.message || '发布评价失败')
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  // 重置数据
  formData.rating = 5
  formData.content = ''
  formData.images = []
  formData.isAnonymous = false
  formData.tagIds = []
  fileList.value = []
  
  emit('update:modelValue', false)
}

// 监听对话框打开，重置表单
watch(visible, (newVal) => {
  if (newVal) {
    // 对话框打开时重置表单
    formData.rating = 5
    formData.content = ''
    formData.images = []
    formData.isAnonymous = false
    formData.tagIds = []
    fileList.value = []
    // 加载标签
    loadTags()
  }
})

onMounted(() => {
  loadTags()
})
</script>

<style scoped>
.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.product-specs {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rating-desc {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-top: 8px;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.2s;
}

.tag-item:hover {
  transform: translateY(-1px);
}

.dialog-footer {
  text-align: right;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
}

:deep(.el-rate__text) {
  font-size: 14px;
}
</style>
