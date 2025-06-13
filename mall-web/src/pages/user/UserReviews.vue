<template>
  <div class="user-reviews-container">
    <h2 class="page-title">评价管理</h2>
    <el-divider />

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filter" inline>
        <el-form-item label="评分筛选">
          <el-select
            v-model="filter.rating"
            placeholder="全部评分"
            clearable
            class="filter-select"
            style="width: 140px;"
          >
            <el-option label="5星" :value="5" />
            <el-option label="4星" :value="4" />
            <el-option label="3星" :value="3" />
            <el-option label="2星" :value="2" />
            <el-option label="1星" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序方式">
          <el-select
            v-model="filter.sortBy"
            class="filter-select"
            style="width: 140px;"
          >
            <el-option label="最新发布" value="time" />
            <el-option label="评分最高" value="rating" />
            <el-option label="点赞最多" value="like" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReviews">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 评价列表 -->
    <div class="reviews-list" v-loading="loading">
      <div v-if="reviews.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无评价记录" />
      </div>

      <div v-else class="review-cards">
        <el-card
          v-for="review in reviews"
          :key="review.id"
          class="review-card"
          shadow="hover"
        >
          <div class="review-header">
            <div class="product-info">
              <el-image
                :src="getProductImage(review.productImage)"
                fit="cover"
                class="product-image"
              />
              <div class="product-details">
                <h4 class="product-name">{{ review.productName }}</h4>
                <div class="review-meta">
                  <el-rate
                    v-model="review.rating"
                    disabled
                    size="small"
                  />
                  <span class="review-time">{{ formatTime(review.createTime) }}</span>
                </div>
              </div>
            </div>
            <div class="review-actions">
              <el-button
                type="primary"
                text
                @click="viewReviewDetail(review)"
              >
                查看详情
              </el-button>
              <!-- 前台用户不能删除评论，只有后台管理员可以删除 -->
            </div>
          </div>

          <div class="review-content">
            <p class="review-text">{{ review.content }}</p>

            <!-- 评价图片 -->
            <div v-if="review.images && review.images.length > 0" class="review-images">
              <el-image
                v-for="(image, index) in review.images"
                :key="index"
                :src="getReviewImage(image)"
                :preview-src-list="review.images.map(img => getReviewImage(img))"
                :initial-index="index"
                fit="cover"
                class="review-image"
                lazy
              />
            </div>
          </div>

          <!-- 商家回复 -->
          <div v-if="review.reply" class="merchant-reply">
            <div class="reply-header">
              <span class="reply-label">商家回复：</span>
              <span class="reply-time">{{ formatTime(review.reply.createTime) }}</span>
            </div>
            <p class="reply-content">{{ review.reply.content }}</p>
          </div>

          <!-- 评价状态 -->
          <div class="review-status">
            <el-tag
              :type="getStatusType(review.status)"
              size="small"
            >
              {{ review.statusName || getStatusName(review.status) }}
            </el-tag>
            <span class="like-count" v-if="review.likeCount > 0">
              👍 {{ review.likeCount }}
            </span>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="filter.page"
        v-model:page-size="filter.size"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadReviews"
        @current-change="loadReviews"
      />
    </div>

    <!-- 评价详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="评价详情"
      width="700px"
      :close-on-click-modal="false"
      class="review-detail-dialog"
    >
      <div v-if="detailDialog.reviewData" class="review-detail">
        <!-- 商品信息卡片 -->
        <el-card class="product-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">商品信息</span>
            </div>
          </template>
          <div class="product-info">
            <el-image
              :src="getProductImage(detailDialog.reviewData.productImage)"
              fit="cover"
              class="product-image"
              :preview-src-list="[getProductImage(detailDialog.reviewData.productImage)]"
            />
            <div class="product-details">
              <div class="product-name">{{ detailDialog.reviewData.productName }}</div>
              <div class="product-specs" v-if="detailDialog.reviewData.productSpec || detailDialog.reviewData.specInfo">
                <el-tag size="small" type="info">
                  {{ detailDialog.reviewData.productSpec || detailDialog.reviewData.specInfo }}
                </el-tag>
              </div>
              <div class="product-id">商品ID: {{ detailDialog.reviewData.productId }}</div>
            </div>
          </div>
        </el-card>

        <!-- 评价信息卡片 -->
        <el-card class="review-info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">评价信息</span>
              <el-tag
                :type="getStatusType(detailDialog.reviewData.status)"
                size="small"
              >
                {{ detailDialog.reviewData.statusName || getStatusName(detailDialog.reviewData.status) }}
              </el-tag>
            </div>
          </template>
          <div class="review-info">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">评分</div>
                  <div class="info-value">
                    <el-rate
                      v-model="detailDialog.reviewData.rating"
                      disabled
                      size="small"
                      show-score
                      text-color="#ff9900"
                    />
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">发表时间</div>
                  <div class="info-value">{{ formatTime(detailDialog.reviewData.createTime) }}</div>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">评价用户</div>
                  <div class="info-value">
                    <el-tag size="small" :type="detailDialog.reviewData.isAnonymous ? 'info' : 'success'">
                      {{ detailDialog.reviewData.isAnonymous ? '匿名用户' : detailDialog.reviewData.userNickname }}
                    </el-tag>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">订单编号</div>
                  <div class="info-value">{{ detailDialog.reviewData.orderSn || '未知' }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 评价内容卡片 -->
        <el-card class="content-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">评价内容</span>
              <span class="content-length">{{ detailDialog.reviewData.content?.length || 0 }} 字</span>
            </div>
          </template>
          <div class="review-content-wrapper">
            <div class="review-text">{{ detailDialog.reviewData.content || '暂无评价内容' }}</div>

            <!-- 评价图片 -->
            <div v-if="detailDialog.reviewData.images && Array.isArray(detailDialog.reviewData.images) && detailDialog.reviewData.images.length > 0" class="review-images-section">
              <div class="images-header">
                <span class="images-title">评价图片</span>
                <span class="images-count">{{ detailDialog.reviewData.images.length }} 张</span>
              </div>
              <div class="review-images">
                <el-image
                  v-for="(image, index) in detailDialog.reviewData.images"
                  :key="index"
                  :src="getReviewImage(image)"
                  :preview-src-list="detailDialog.reviewData.images.map(img => getReviewImage(img))"
                  :initial-index="index"
                  fit="cover"
                  class="review-image"
                  lazy
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
              </div>
            </div>
            <div v-else class="no-images">
              <el-icon><Picture /></el-icon>
              <span>暂无评价图片</span>
            </div>
          </div>
        </el-card>

        <!-- 标签信息卡片 -->
        <el-card v-if="detailDialog.reviewData.tags && detailDialog.reviewData.tags.length > 0" class="tags-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">评价标签</span>
              <span class="tags-count">{{ detailDialog.reviewData.tags.length }} 个</span>
            </div>
          </template>
          <div class="tags-list">
            <el-tag
              v-for="tag in detailDialog.reviewData.tags"
              :key="tag.id"
              size="small"
              :type="getTagType(tag.type)"
              class="tag-item"
              effect="light"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </el-card>

        <!-- 商家回复卡片 -->
        <el-card v-if="detailDialog.reviewData.replies && detailDialog.reviewData.replies.length > 0" class="replies-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">商家回复</span>
              <span class="replies-count">{{ detailDialog.reviewData.replies.length }} 条</span>
            </div>
          </template>
          <div class="replies-list">
            <div
              v-for="reply in detailDialog.reviewData.replies"
              :key="reply.id"
              class="reply-item"
            >
              <div class="reply-header">
                <div class="reply-author">
                  <el-avatar :size="24" class="author-avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <span class="author-name">{{ reply.userNickname || '商家' }}</span>
                </div>
                <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
              </div>
              <div class="reply-content">{{ reply.content }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Picture, User } from '@element-plus/icons-vue'
import { reviewApi } from '../../api/review'
import type { Review } from '../../types/review'
import { API_BASE_URL } from '../../api/config'
import { getReviewImageUrl, getProductImageUrl } from '../../utils/imageUtils'

const loading = ref(false)
const reviews = ref<Review[]>([])
const total = ref(0)

const filter = reactive({
  page: 1,
  size: 10,
  sortBy: 'time',
  rating: undefined as number | undefined
})

const detailDialog = reactive({
  visible: false,
  reviewData: null as any
})

// 加载评价列表
const loadReviews = async () => {
  loading.value = true
  try {
    // 直接使用商家评论搜索接口
    const searchParams = {
      rating: filter.rating,
      sortBy: filter.sortBy,
      page: filter.page,
      size: filter.size
    }
    console.log('调用商家评论接口，参数:', searchParams)
    const response = await reviewApi.getMerchantReviews(searchParams)

    reviews.value = response.records || []
    total.value = response.total

    // 添加调试信息
    console.log('评价数据:', reviews.value)
    reviews.value.forEach((review, index) => {
      console.log(`评价${index + 1}:`, {
        id: review.id,
        productName: review.productName,
        productImage: review.productImage,
        images: review.images,
        imagesType: typeof review.images
      })

      // 如果有评价图片，打印处理后的URL
      if (review.images) {
        let images: any = review.images
        if (typeof images === 'string') {
          try {
            images = JSON.parse(images)
          } catch (e) {
            images = [images]
          }
        }
        if (Array.isArray(images)) {
          images.forEach((img: string, imgIndex: number) => {
            console.log(`评价${index + 1}图片${imgIndex + 1}:`, {
              原始路径: img,
              处理后URL: getReviewImage(img)
            })
          })
        }
      }
    })
  } catch (error: any) {
    console.error('加载评价失败:', error)
    ElMessage.error(error.message || '加载评价失败')
  } finally {
    loading.value = false
  }
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
    case 1: return 'success' // 已通过
    case 2: return 'danger'  // 已拒绝
    default: return 'info'
  }
}

// 获取状态名称
const getStatusName = (status: number) => {
  switch (status) {
    case 0: return '待审核'
    case 1: return '已通过'
    case 2: return '已拒绝'
    default: return '未知状态'
  }
}

// 获取标签类型
const getTagType = (type: number) => {
  switch (type) {
    case 1: return 'success' // 正面标签
    case 2: return 'danger'  // 负面标签
    case 3: return 'warning' // 中性标签
    default: return 'info'   // 默认标签
  }
}

// 获取商品图片路径
const getProductImage = (image: string) => {
  return getProductImageUrl(image) || '/images/placeholder.jpg'
}

// 获取评论图片路径 - 使用统一的工具函数
const getReviewImage = (image: string) => {
  return getReviewImageUrl(image)
}

// 查看评价详情
const viewReviewDetail = async (review: Review) => {
  try {
    // 获取完整的评价详情，包括标签信息
    const fullReviewData = await reviewApi.getReviewDetail(review.id)

    // 设置详情对话框数据，优先使用详情API的数据，但确保关键字段不为空
    detailDialog.reviewData = {
      ...review, // 先使用列表数据作为基础
      ...fullReviewData, // 然后用详情数据覆盖
      // 确保关键字段不为空，优先使用详情数据，其次使用列表数据
      productId: fullReviewData.productId || review.productId,
      productName: fullReviewData.productName || review.productName || '未知商品',
      productImage: fullReviewData.productImage || review.productImage || '',
      productSpec: fullReviewData.productSpec || review.productSpec || '',
      specInfo: fullReviewData.specInfo || review.specInfo || '',
      // 处理图片数据：需要处理JSON字符串格式
      images: (() => {
        // 尝试从详情API数据中获取图片
        let images = fullReviewData.images || review.images

        // 如果图片数据存在
        if (images) {
          // 如果是字符串，尝试解析为JSON
          if (typeof images === 'string') {
            try {
              images = JSON.parse(images)
            } catch (error) {
              console.warn('解析图片JSON失败:', error, '原始数据:', images)
              // 如果解析失败，尝试作为单个图片路径处理
              return [images]
            }
          }

          // 确保返回数组格式
          return Array.isArray(images) ? images : [images]
        }

        // 都没有则返回空数组
        return []
      })()
    }

    detailDialog.visible = true
  } catch (error: any) {
    console.error('获取评价详情失败:', error)
    // 如果获取详情失败，直接使用列表中的数据
    detailDialog.reviewData = {
      ...review,
      // 确保图片数据格式正确，处理JSON字符串
      images: (() => {
        let images = review.images
        if (images) {
          // 如果是字符串，尝试解析为JSON
          if (typeof images === 'string') {
            try {
              images = JSON.parse(images)
            } catch (error) {
              console.warn('解析图片JSON失败:', error, '原始数据:', images)
              return [images]
            }
          }
          return Array.isArray(images) ? images : [images]
        }
        return []
      })()
    }
    detailDialog.visible = true
  }
}

// 注意：前台用户不能删除评论，删除功能只在后台管理端提供



onMounted(() => {
  loadReviews()
})
</script>

<style scoped>
.user-reviews-container {
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

.reviews-list {
  min-height: 400px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.review-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card .review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.review-card .product-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.review-card .product-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  flex-shrink: 0;
}

.review-card .product-details {
  flex: 1;
}

.review-card .product-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.review-card .review-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-card .review-time {
  font-size: 14px;
  color: #999;
}

.review-card .review-actions {
  display: flex;
  gap: 8px;
}

.review-card .review-content {
  margin-bottom: 16px;
}

.review-card .review-text {
  line-height: 1.6;
  color: #333;
  margin-bottom: 12px;
}

.review-card .review-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.review-card .review-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
}

.review-card .merchant-reply {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.review-card .reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.review-card .reply-label {
  font-weight: 500;
  color: #e6a23c;
}

.review-card .reply-time {
  color: #999;
  font-size: 12px;
}

.review-card .reply-content {
  color: #666;
  line-height: 1.5;
}

.review-card .review-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-card .like-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 14px;
}

.pagination {
  margin-top: 30px;
  text-align: center;
}

/* 详情对话框样式 */
.review-detail-dialog .el-dialog__body {
  padding: 0;
}

.review-detail {
  max-height: 75vh;
  overflow-y: auto;
  padding: 20px;
}

.review-detail .el-card {
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
}

.review-detail .el-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.content-length,
.tags-count,
.replies-count,
.images-count {
  font-size: 12px;
  color: #999;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 商品信息样式 */
.product-card .product-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.product-card .product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  flex-shrink: 0;
  border: 1px solid #f0f0f0;
}

.product-card .product-details {
  flex: 1;
}

.product-card .product-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.product-card .product-specs {
  margin-bottom: 8px;
}

.product-card .product-id {
  font-size: 12px;
  color: #999;
}

/* 评价信息样式 */
.review-info-card .info-item {
  margin-bottom: 16px;
}

.review-info-card .info-item:last-child {
  margin-bottom: 0;
}

.review-info-card .info-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.review-info-card .info-value {
  font-size: 14px;
  color: #333;
}

/* 评价内容样式 */
.content-card .review-content-wrapper {
  padding: 0;
}

.content-card .review-text {
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;
  background: #fafbfc;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  font-size: 14px;
  min-height: 60px;
}

.content-card .review-images-section {
  margin-top: 16px;
}

.content-card .images-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.content-card .images-title {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.content-card .review-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.content-card .review-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.content-card .review-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.content-card .image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 12px;
}

.content-card .no-images {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
  padding: 20px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

/* 标签样式 */
.tags-card .tags-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tags-card .tag-item {
  margin: 0;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 16px;
}

/* 回复样式 */
.replies-card .replies-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.replies-card .reply-item {
  background: #fafbfc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.replies-card .reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.replies-card .reply-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.replies-card .author-avatar {
  background: #409eff;
  color: white;
}

.replies-card .author-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.replies-card .reply-time {
  color: #999;
  font-size: 12px;
}

.replies-card .reply-content {
  color: #666;
  line-height: 1.6;
  font-size: 14px;
  background: white;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}
</style>
