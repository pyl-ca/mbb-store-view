<template>
  <div class="review-management">
    <div class="page-header">
      <h2>评论管理</h2>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="商品ID">
          <el-input
            v-model="filterForm.productId"
            placeholder="请输入商品ID"
            clearable
            style="width: 150px;"
          />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input
            v-model="filterForm.userId"
            placeholder="请输入用户ID"
            clearable
            style="width: 150px;"
          />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="待审核" value="0" />
            <el-option label="已通过" value="1" />
            <el-option label="已拒绝" value="2" />
            <el-option label="已删除" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分">
          <el-select v-model="filterForm.rating" placeholder="请选择评分" clearable style="width: 100px;">
            <el-option label="1星" value="1" />
            <el-option label="2星" value="2" />
            <el-option label="3星" value="3" />
            <el-option label="4星" value="4" />
            <el-option label="5星" value="5" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReviews">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作 -->
    <el-card class="action-card">
      <div class="batch-actions">
        <el-button
          type="success"
          :disabled="selectedReviews.length === 0"
          @click="batchAudit(1)"
        >
          批量通过
        </el-button>
        <el-button
          type="danger"
          :disabled="selectedReviews.length === 0"
          @click="batchAudit(2)"
        >
          批量拒绝
        </el-button>
        <span class="selected-count">已选择 {{ selectedReviews.length }} 条评论</span>
      </div>
    </el-card>

    <!-- 评论列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="reviews"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :src="row.userAvatar" :size="32">
                {{ row.userNickname?.charAt(0) }}
              </el-avatar>
              <div class="user-details">
                <div class="username">{{ row.userNickname }}</div>
                <div class="user-id">ID: {{ row.userId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" width="200">
          <template #default="{ row }">
            <div class="product-info">
              <el-image
                v-if="row.productImage"
                :src="row.productImage"
                fit="cover"
                class="product-image"
              />
              <div class="product-details">
                <div class="product-name">{{ row.productName }}</div>
                <div class="product-id">ID: {{ row.productId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="100">
          <template #default="{ row }">
            <el-rate :model-value="row.rating" disabled size="small" />
            <div class="rating-text">{{ row.ratingName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="评论内容" min-width="300">
          <template #default="{ row }">
            <div class="review-content">
              <p class="content-text">{{ row.content }}</p>
              <div v-if="row.tags && row.tags.length > 0" class="tags">
                <el-tag
                  v-for="tag in row.tags"
                  :key="tag.id"
                  :type="tag.type === 1 ? 'success' : tag.type === 2 ? 'danger' : 'info'"
                  size="small"
                >
                  {{ tag.name }}
                </el-tag>
              </div>
              <div v-if="row.images && row.images.length > 0" class="images">
                <el-image
                  v-for="(image, index) in row.images.slice(0, 3)"
                  :key="index"
                  :src="image"
                  fit="cover"
                  class="review-image"
                  :preview-src-list="row.images"
                  :initial-index="index"
                />
                <span v-if="row.images.length > 3" class="more-images">
                  +{{ row.images.length - 3 }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ row.statusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="统计" width="120">
          <template #default="{ row }">
            <div class="stats">
              <div>👍 {{ row.likeCount }}</div>
              <div>💬 {{ row.replyCount }}</div>
              <div v-if="row.isTop" class="top-badge">🔝 置顶</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="row.status === 0"
                type="success"
                size="small"
                @click="auditReview(row.id, 1)"
              >
                通过
              </el-button>
              <el-button
                v-if="row.status === 0"
                type="danger"
                size="small"
                @click="auditReview(row.id, 2)"
              >
                拒绝
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="toggleTop(row)"
              >
                {{ row.isTop ? '取消置顶' : '置顶' }}
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="viewReplies(row)"
              >
                查看回复
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="filterForm.page"
          v-model:page-size="filterForm.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadReviews"
          @current-change="loadReviews"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reviewApi } from '../../api/review'
import type { Review } from '../../types/review'

const loading = ref(false)
const reviews = ref<Review[]>([])
const total = ref(0)
const selectedReviews = ref<Review[]>([])

const filterForm = reactive({
  productId: '',
  userId: '',
  status: '',
  rating: '',
  page: 1,
  size: 20
})

// 加载评论列表
const loadReviews = async () => {
  loading.value = true
  try {
    const filter = {
      ...filterForm,
      productId: filterForm.productId ? Number(filterForm.productId) : undefined,
      userId: filterForm.userId ? Number(filterForm.userId) : undefined,
      status: filterForm.status ? Number(filterForm.status) : undefined,
      rating: filterForm.rating ? Number(filterForm.rating) : undefined
    }
    
    const response = await reviewApi.getAdminReviews(filter)
    reviews.value = response.records
    total.value = response.total
  } catch (error: any) {
    ElMessage.error(error.message || '加载评论列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilter = () => {
  Object.assign(filterForm, {
    productId: '',
    userId: '',
    status: '',
    rating: '',
    page: 1,
    size: 20
  })
  loadReviews()
}

// 选择变化
const handleSelectionChange = (selection: Review[]) => {
  selectedReviews.value = selection
}

// 批量审核
const batchAudit = async (status: number) => {
  const action = status === 1 ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(`确定要批量${action}选中的 ${selectedReviews.value.length} 条评论吗？`, `批量${action}`, {
      type: 'warning'
    })

    const reviewIds = selectedReviews.value.map(review => Number(review.id))
    await reviewApi.batchAuditReviews({
      reviewIds,
      status,
      reason: `批量${action}操作`
    })

    ElMessage.success(`批量${action}成功`)
    loadReviews()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `批量${action}失败`)
    }
  }
}

// 单个审核
const auditReview = async (reviewId: number, status: number) => {
  const action = status === 1 ? '通过' : '拒绝'
  try {
    await reviewApi.auditReview(reviewId, status, `${action}审核`)
    ElMessage.success(`${action}成功`)
    loadReviews()
  } catch (error: any) {
    ElMessage.error(error.message || `${action}失败`)
  }
}

// 置顶/取消置顶
const toggleTop = async (review: Review) => {
  const action = review.isTop ? '取消置顶' : '置顶'
  try {
    await reviewApi.toggleReviewTop(Number(review.id))
    ElMessage.success(`${action}成功`)
    loadReviews()
  } catch (error: any) {
    ElMessage.error(error.message || `${action}失败`)
  }
}

// 查看回复
const viewReplies = (review: Review) => {
  // TODO: 实现查看回复功能
  ElMessage.info('查看回复功能待实现')
}

// 获取状态类型
const getStatusType = (status: number) => {
  switch (status) {
    case 0: return 'warning'
    case 1: return 'success'
    case 2: return 'danger'
    case 3: return 'info'
    default: return 'info'
  }
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  loadReviews()
})
</script>

<style scoped>
.review-management {
  padding: 20px;
}

.page-header h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.filter-card,
.action-card,
.table-card {
  margin-bottom: 20px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  color: #666;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-details {
  flex: 1;
}

.username {
  font-weight: 500;
  font-size: 14px;
}

.user-id {
  font-size: 12px;
  color: #999;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.product-id {
  font-size: 12px;
  color: #999;
}

.rating-text {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 2px;
}

.review-content {
  max-width: 300px;
}

.content-text {
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  margin-bottom: 8px;
}

.tags .el-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.images {
  display: flex;
  gap: 4px;
  align-items: center;
}

.review-image {
  width: 30px;
  height: 30px;
  border-radius: 2px;
}

.more-images {
  font-size: 12px;
  color: #666;
}

.stats {
  font-size: 12px;
  line-height: 1.5;
}

.top-badge {
  color: #e6a23c;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-buttons .el-button {
  margin: 0;
  padding: 4px 8px;
  font-size: 12px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}
</style>
