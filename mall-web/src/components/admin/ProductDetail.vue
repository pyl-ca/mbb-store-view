<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="商品详情"
    width="80%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="productData" class="product-detail">
      <!-- 基本信息 -->
      <el-card class="detail-section" header="基本信息">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>商品ID：</label>
              <span>{{ productData.id }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>商品名称：</label>
              <span>{{ productData.name }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>商品副标题：</label>
              <span>{{ productData.subTitle || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>商品分类：</label>
              <span>{{ productData.categoryName || '-' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>商品品牌：</label>
              <span>{{ productData.brand || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>商品单位：</label>
              <span>{{ productData.unit || '-' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="detail-item">
              <label>排序：</label>
              <span>{{ productData.sort || 0 }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="detail-item">
              <label>商品状态：</label>
              <el-tag :type="productData.status ? 'success' : 'danger'">
                {{ productData.status ? '上架' : '下架' }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="detail-item">
              <label>推荐状态：</label>
              <el-tag :type="productData.recommend ? 'warning' : 'info'">
                {{ productData.recommend ? '推荐' : '不推荐' }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="detail-item">
              <label>销量：</label>
              <span>{{ productData.sales || 0 }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 价格信息 -->
      <el-card class="detail-section" header="价格信息">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="detail-item">
              <label>现价：</label>
              <span class="price-text">¥{{ productData.price?.toFixed(2) || '0.00' }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="detail-item">
              <label>原价：</label>
              <span class="original-price">¥{{ productData.originalPrice?.toFixed(2) || '0.00' }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="detail-item">
              <label>市场价：</label>
              <span>¥{{ productData.marketPrice?.toFixed(2) || '0.00' }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="detail-item">
              <label>会员价：</label>
              <span>¥{{ productData.memberPrice?.toFixed(2) || '0.00' }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 库存信息 -->
      <el-card class="detail-section" header="库存信息">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>库存数量：</label>
              <el-tag :type="productData.stock <= (productData.warningStock || 5) ? 'danger' : 'success'">
                {{ productData.stock || 0 }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>预警库存：</label>
              <span>{{ productData.warningStock || 0 }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 商品图片 -->
      <el-card class="detail-section" header="商品图片">
        <div class="image-section">
          <div class="main-image">
            <label>商品主图：</label>
            <div class="image-container">
              <el-image
                v-if="productData.image"
                :src="getImageUrl(productData.image)"
                :preview-src-list="[getImageUrl(productData.image)]"
                class="product-image"
                fit="cover"
              />
              <span v-else class="no-image">暂无图片</span>
            </div>
          </div>

          <div v-if="productData.detailImages && productData.detailImages.length > 0" class="detail-images">
            <label>详情图片：</label>
            <div class="images-grid">
              <el-image
                v-for="(image, index) in productData.detailImages"
                :key="index"
                :src="getImageUrl(image)"
                :preview-src-list="productData.detailImages.map(img => getImageUrl(img))"
                class="detail-image"
                fit="cover"
              />
            </div>
          </div>
        </div>
      </el-card>

      <!-- 商品描述 -->
      <el-card class="detail-section" header="商品描述">
        <div class="description-content">
          <div v-if="productData.description" v-html="productData.description"></div>
          <span v-else class="no-content">暂无描述</span>
        </div>
      </el-card>

      <!-- 定时设置 -->
      <el-card class="detail-section" header="定时设置">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>定时上架：</label>
              <span>{{ productData.scheduledOnTime || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>定时下架：</label>
              <span>{{ productData.scheduledOffTime || '-' }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 时间信息 -->
      <el-card class="detail-section" header="时间信息">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>创建时间：</label>
              <span>{{ formatTime(productData.createTime) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>更新时间：</label>
              <span>{{ formatTime(productData.updateTime) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleEdit">编辑商品</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getProductImageUrl } from '../../utils/imageUtils'

// Props
interface Props {
  visible: boolean
  productData?: any
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  productData: null
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'edit': [product: any]
}>()

// 获取图片URL
function getImageUrl(imagePath: string) {
  return getProductImageUrl(imagePath)
}

// 格式化时间
function formatTime(timeStr: string) {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 处理关闭
function handleClose() {
  emit('update:visible', false)
}

// 处理编辑
function handleEdit() {
  emit('edit', props.productData)
  handleClose()
}
</script>

<style scoped>
.product-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section :deep(.el-card__header) {
  background-color: #f5f7fa;
  font-weight: bold;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.detail-item label {
  font-weight: bold;
  color: #606266;
  min-width: 100px;
  margin-right: 10px;
}

.price-text {
  color: #e6a23c;
  font-weight: bold;
  font-size: 16px;
}

.original-price {
  color: #909399;
  text-decoration: line-through;
}

.image-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-image,
.detail-images {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.main-image label,
.detail-images label {
  font-weight: bold;
  color: #606266;
  min-width: 100px;
  margin-top: 10px;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.product-image {
  width: 120px;
  height: 120px;
}

.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-image {
  width: 80px;
  height: 80px;
  border-radius: 6px;
}

.no-image,
.no-content {
  color: #909399;
  font-style: italic;
}

.description-content {
  line-height: 1.6;
  color: #606266;
}

.dialog-footer {
  text-align: right;
}
</style>
