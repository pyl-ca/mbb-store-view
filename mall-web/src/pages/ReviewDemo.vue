<template>
  <div class="review-demo-container">
    <div class="page-header">
      <h1 class="page-title">商品评论功能演示</h1>
      <p class="page-desc">这是一个商品评论功能的演示页面，展示了评论列表、筛选、分页等功能</p>
    </div>

    <!-- 模拟商品信息 -->
    <div class="product-demo">
      <el-card>
        <div class="product-info">
          <el-image
            src="/images/placeholder/product.png"
            fit="cover"
            class="product-image"
          />
          <div class="product-details">
            <h3>演示商品 - iPhone 15 Pro Max</h3>
            <p>颜色：深空黑色 | 容量：256GB</p>
            <div class="product-rating">
              <el-rate v-model="demoRating" disabled show-score text-color="#ff9900" />
              <span class="rating-text">{{ demoRating.toFixed(1) }}分 ({{ demoReviewCount }}条评价)</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 评论组件演示 -->
    <div class="reviews-demo">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>商品评价</span>
            <el-button type="primary" @click="showMockData = !showMockData">
              {{ showMockData ? '隐藏' : '显示' }}模拟数据
            </el-button>
          </div>
        </template>

        <div v-if="showMockData">
          <ProductReviews :product-id="1" ref="reviewsRef" />
        </div>
        <div v-else class="empty-state">
          <el-empty description="点击上方按钮查看评论演示" />
        </div>
      </el-card>
    </div>

    <!-- 功能说明 -->
    <div class="feature-intro">
      <el-card>
        <template #header>
          <span>功能特性</span>
        </template>

        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">📝</div>
            <h4>评论发布</h4>
            <p>支持星级评分、文字评论、图片上传</p>
          </div>

          <div class="feature-item">
            <div class="feature-icon">🔍</div>
            <h4>评论筛选</h4>
            <p>按评分、时间、是否有图等条件筛选</p>
          </div>

          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <h4>评论统计</h4>
            <p>评分分布、平均评分、评论数量统计</p>
          </div>

          <div class="feature-item">
            <div class="feature-icon">👍</div>
            <h4>互动功能</h4>
            <p>点赞评论、商家回复、匿名评价</p>
          </div>

          <div class="feature-item">
            <div class="feature-icon">🛡️</div>
            <h4>内容审核</h4>
            <p>评论审核机制，确保内容质量</p>
          </div>

          <div class="feature-item">
            <div class="feature-icon">📱</div>
            <h4>响应式设计</h4>
            <p>适配各种设备，提供良好用户体验</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- API 说明 -->
    <div class="api-intro">
      <el-card>
        <template #header>
          <span>API 接口说明</span>
        </template>

        <div class="api-list">
          <div class="api-item">
            <el-tag type="success">GET</el-tag>
            <code>/api/v1/reviews</code>
            <span>获取商品评论列表</span>
          </div>

          <div class="api-item">
            <el-tag type="primary">POST</el-tag>
            <code>/api/v1/reviews</code>
            <span>发布商品评论</span>
          </div>

          <div class="api-item">
            <el-tag type="warning">PUT</el-tag>
            <code>/api/v1/reviews/{id}</code>
            <span>更新评论内容</span>
          </div>

          <div class="api-item">
            <el-tag type="danger">DELETE</el-tag>
            <code>/api/v1/reviews/{id}</code>
            <span>删除评论</span>
          </div>

          <div class="api-item">
            <el-tag type="info">GET</el-tag>
            <code>/api/v1/reviews/stats/{productId}</code>
            <span>获取评论统计信息</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 注意事项 -->
    <div class="notice">
      <el-alert
        title="开发说明"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>1. 当前为演示版本，后端API接口尚未实现，评论数据为模拟数据</p>
          <p>2. 实际使用时需要配置对应的后端服务和数据库</p>
          <p>3. 图片上传功能需要配置文件存储服务</p>
          <p>4. 评论审核功能需要管理后台支持</p>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProductReviews from '../components/ProductReviews.vue'

const showMockData = ref(false)
const demoRating = ref(4.5)
const demoReviewCount = ref(128)
const reviewsRef = ref()
</script>

<style scoped>
.review-demo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  color: #333;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.page-desc {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.product-demo,
.reviews-demo,
.feature-intro,
.api-intro {
  margin-bottom: 30px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.product-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-details h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px 0;
}

.product-details p {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-text {
  font-size: 14px;
  color: #666;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.feature-item h4 {
  font-size: 16px;
  color: #333;
  margin: 0 0 8px 0;
}

.feature-item p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.api-item code {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.notice {
  margin-top: 30px;
}

.notice p {
  margin: 8px 0;
  line-height: 1.6;
}
</style>
