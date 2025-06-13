<template>
  <div class="product-reviews">
    <!-- 评论统计 -->
    <div class="review-stats">
      <div class="stats-summary">
        <div class="average-rating">
          <span class="rating-score">{{ stats.averageRating.toFixed(1) }}</span>
          <el-rate
            v-model="stats.averageRating"
            disabled
            show-score
            text-color="#ff9900"
            score-template="{value}分"
          />
          <span class="total-count">共{{ stats.totalCount }}条评价</span>
        </div>

        <div class="rating-distribution">
          <div
            v-for="(count, rating) in stats.ratingDistribution"
            :key="rating"
            class="rating-bar"
          >
            <span class="rating-label">{{ rating }}星</span>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: getPercentage(count) + '%' }"
              ></div>
            </div>
            <span class="rating-count">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="review-filters">
      <el-button-group>
        <el-button
          :type="filter.rating === undefined ? 'primary' : 'default'"
          @click="setRatingFilter(undefined)"
        >
          全部({{ stats.totalCount }})
        </el-button>
        <el-button
          v-for="rating in [5, 4, 3, 2, 1]"
          :key="rating"
          :type="filter.rating === rating ? 'primary' : 'default'"
          @click="setRatingFilter(rating)"
        >
          {{ rating }}星({{ stats.ratingDistribution[rating] || 0 }})
        </el-button>
        <el-button
          :type="filter.hasImage ? 'primary' : 'default'"
          @click="toggleImageFilter"
        >
          有图({{ stats.hasImageCount }})
        </el-button>
      </el-button-group>

      <el-select v-model="filter.sortBy" @change="loadReviews" style="width: 150px; margin-left: 20px;">
        <el-option label="最新" value="newest" />
        <el-option label="最早" value="oldest" />
        <el-option label="评分高" value="rating_high" />
        <el-option label="评分低" value="rating_low" />
        <el-option label="最多赞" value="most_liked" />
      </el-select>
    </div>

    <!-- 评论列表 -->
    <div class="review-list" v-loading="loading">
      <div v-if="reviews.length === 0" class="empty-reviews">
        <el-empty description="暂无评价" />
      </div>

      <div v-else>
        <div
          v-for="review in reviews"
          :key="review.id"
          class="review-item"
        >
          <div class="review-header">
            <div class="user-info">
              <el-avatar
                :src="review.userAvatar"
                :size="40"
                class="user-avatar"
              >
                {{ review.isAnonymous ? '匿' : review.userNickname?.charAt(0) }}
              </el-avatar>
              <div class="user-details">
                <span class="username">
                  {{ review.isAnonymous ? '匿名用户' : maskUsername(review.userNickname) }}
                </span>
                <el-rate
                  v-model="review.rating"
                  disabled
                  size="small"
                />
                <span class="rating-text">{{ review.ratingName }}</span>
              </div>
            </div>
            <div class="review-time">
              {{ formatTime(review.createTime) }}
            </div>
          </div>

          <div class="review-content">
            <p class="review-text">{{ review.content }}</p>

            <!-- 评论标签 -->
            <div v-if="review.tags && review.tags.length > 0" class="review-tags">
              <el-tag
                v-for="tag in review.tags"
                :key="tag.id"
                :type="tag.type === 1 ? 'success' : tag.type === 2 ? 'danger' : 'info'"
                size="small"
                class="review-tag"
              >
                {{ tag.name }}
              </el-tag>
            </div>

            <!-- 规格信息 -->
            <div v-if="review.specInfo" class="spec-info">
              <span class="spec-label">规格：</span>
              <span class="spec-value">{{ review.specInfo }}</span>
            </div>

            <!-- 评论图片 -->
            <div v-if="review.images && review.images.length > 0" class="review-images">
              <el-image
                v-for="(image, index) in review.images"
                :key="index"
                :src="getReviewImageUrl(image)"
                :preview-src-list="review.images.map(img => getReviewImageUrl(img))"
                :initial-index="index"
                fit="cover"
                class="review-image"
                lazy
              />
            </div>
          </div>

          <!-- 回复列表 -->
          <div v-if="review.replies && review.replies.length > 0" class="replies-section">
            <div
              v-for="reply in review.replies"
              :key="reply.id"
              class="reply-item"
              :class="{ 'merchant-reply': reply.isMerchant }"
            >
              <div class="reply-header">
                <div class="reply-user">
                  <el-avatar :src="reply.userAvatar" :size="24">
                    {{ reply.userNickname?.charAt(0) }}
                  </el-avatar>
                  <span class="reply-username">{{ reply.userNickname }}</span>
                  <el-tag v-if="reply.isMerchant" type="warning" size="small">商家</el-tag>
                  <span v-if="reply.replyToNickname" class="reply-to">
                    回复 @{{ reply.replyToNickname }}
                  </span>
                </div>
                <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
              </div>
              <p class="reply-content">{{ reply.content }}</p>
              <div class="reply-actions">
                <el-button
                  text
                  size="small"
                  :type="reply.isLiked ? 'primary' : 'default'"
                  @click="toggleReplyLike(reply)"
                >
                  👍 {{ reply.likeCount > 0 ? reply.likeCount : '赞' }}
                </el-button>
                <el-button text size="small" @click="showReplyDialog(review, reply)">
                  回复
                </el-button>
              </div>
            </div>
          </div>

          <!-- 评论操作 -->
          <div class="review-actions">
            <el-button
              text
              :type="review.isLiked ? 'primary' : 'default'"
              @click="toggleLike(review)"
            >
              👍 {{ review.likeCount > 0 ? review.likeCount : '赞' }}
            </el-button>
            <el-button text @click="showReplyDialog(review)">
              💬 {{ review.replyCount > 0 ? review.replyCount : '回复' }}
            </el-button>
          </div>
        </div>
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

    <!-- 回复对话框 -->
    <ReplyDialog
      v-model="showReplyDialogFlag"
      :review-info="currentReview"
      :parent-reply="currentParentReply"
      :can-merchant-reply="false"
      @success="handleReplySuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
// import { ThumbsUp } from '@element-plus/icons-vue'
import { reviewApi } from '../api/review'
import ReplyDialog from './ReplyDialog.vue'
import type { Review, Reply, ReviewFilter, ReviewStats } from '../types/review'
import { getReviewImageUrl } from '../utils/imageUtils'

interface Props {
  productId: number
}

const props = defineProps<Props>()

const loading = ref(false)
const reviews = ref<Review[]>([])
const total = ref(0)
const stats = ref<ReviewStats>({
  totalCount: 0,
  averageRating: 0,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  hasImageCount: 0
})

// 回复对话框状态
const showReplyDialogFlag = ref(false)
const currentReview = ref<Review>()
const currentParentReply = ref<Reply>()

const filter = reactive<ReviewFilter>({
  page: 1,
  size: 10,
  sortBy: 'time',
  sortOrder: 'desc'
})

// 计算百分比
const getPercentage = (count: number) => {
  return stats.value.totalCount > 0 ? (count / stats.value.totalCount) * 100 : 0
}

// 设置评分筛选
const setRatingFilter = (rating?: number) => {
  filter.rating = rating
  filter.page = 1
  loadReviews()
}

// 切换图片筛选
const toggleImageFilter = () => {
  filter.hasImage = !filter.hasImage
  filter.page = 1
  loadReviews()
}

// 加载评论列表
const loadReviews = async () => {
  loading.value = true
  try {
    const response = await reviewApi.getProductReviews(props.productId, filter)
    reviews.value = response.records
    total.value = response.total

    // 调试信息：查看评论数据
    console.log('📝 评论数据加载完成:', {
      productId: props.productId,
      reviewsCount: reviews.value.length,
      reviews: reviews.value
    })

    // 检查是否有评论图片
    reviews.value.forEach((review, index) => {
      if (review.images && review.images.length > 0) {
        console.log(`🖼️ 评论 ${index + 1} 包含图片:`, review.images)
        review.images.forEach((image, imgIndex) => {
          const imageUrl = getReviewImageUrl(image)
          console.log(`🖼️ 图片 ${imgIndex + 1} URL:`, imageUrl)
        })
      }
    })

    // 同时获取统计数据
    const statsData = await reviewApi.getProductReviewStats(props.productId)
    stats.value = statsData
  } catch (error: any) {
    ElMessage.error(error.message || '加载评论失败')
  } finally {
    loading.value = false
  }
}

// 点赞/取消点赞
const toggleLike = async (review: Review) => {
  try {
    const result = await reviewApi.toggleReviewLike(review.id)
    review.isLiked = result
    review.likeCount += result ? 1 : -1
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 回复点赞/取消点赞
const toggleReplyLike = async (reply: any) => {
  try {
    const result = await reviewApi.toggleReplyLike(reply.id)
    reply.isLiked = result
    reply.likeCount += result ? 1 : -1
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 显示回复对话框
const showReplyDialog = (review: Review, parentReply?: Reply) => {
  currentReview.value = review
  currentParentReply.value = parentReply
  showReplyDialogFlag.value = true
}

// 回复成功处理
const handleReplySuccess = () => {
  showReplyDialogFlag.value = false
  // 刷新评论列表
  loadReviews()
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 用户名脱敏
const maskUsername = (username: string) => {
  if (!username || username.length <= 2) return username
  return username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
}

onMounted(() => {
  loadReviews()
})

// 暴露刷新方法给父组件
defineExpose({
  refresh: loadReviews
})
</script>

<style scoped>
.product-reviews {
  margin-top: 20px;
}

.review-stats {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stats-summary {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.average-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rating-score {
  font-size: 36px;
  font-weight: bold;
  color: #ff9900;
}

.total-count {
  color: #666;
  font-size: 14px;
}

.rating-distribution {
  flex: 1;
  max-width: 300px;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.rating-label {
  width: 30px;
  font-size: 14px;
  color: #666;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #ff9900;
  transition: width 0.3s ease;
}

.rating-count {
  width: 30px;
  text-align: right;
  font-size: 14px;
  color: #666;
}

.review-filters {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.review-list {
  min-height: 200px;
}

.empty-reviews {
  text-align: center;
  padding: 40px 0;
}

.review-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-weight: 500;
  color: #333;
}

.review-time {
  color: #999;
  font-size: 14px;
}

.review-content {
  margin-bottom: 12px;
}

.review-text {
  line-height: 1.6;
  color: #333;
  margin-bottom: 12px;
}

.review-tags {
  margin-bottom: 8px;
}

.review-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}

.spec-info {
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.spec-label {
  font-weight: 500;
}

.spec-value {
  color: #999;
}

.rating-text {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.review-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.review-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
}

.replies-section {
  margin-top: 12px;
  padding-left: 20px;
  border-left: 2px solid #f0f0f0;
}

.reply-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #fafafa;
  border-radius: 6px;
}

.reply-item.merchant-reply {
  background: #fff7e6;
  border: 1px solid #ffd591;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reply-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-username {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.reply-to {
  color: #666;
  font-size: 12px;
}

.reply-time {
  color: #999;
  font-size: 12px;
}

.reply-content {
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
}

.reply-actions {
  display: flex;
  gap: 12px;
}

.review-actions {
  display: flex;
  gap: 16px;
}

.pagination {
  margin-top: 30px;
  text-align: center;
}
</style>
