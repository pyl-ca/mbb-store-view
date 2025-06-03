<template>
  <el-button
    :type="isFavorited ? 'danger' : 'default'"
    :icon="isFavorited ? 'HeartFilled' : 'Heart'"
    :loading="loading"
    @click="toggleFavorite"
    :class="['favorite-btn', { 'favorited': isFavorited }]"
  >
    {{ isFavorited ? '已收藏' : '收藏' }}
    <span v-if="showCount && favoriteCount > 0" class="favorite-count">
      ({{ favoriteCount }})
    </span>
  </el-button>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { favoriteApi } from '../api/favorite'

// Props
interface Props {
  productId: string | number
  showCount?: boolean
  size?: 'large' | 'default' | 'small'
}

const props = withDefaults(defineProps<Props>(), {
  showCount: false,
  size: 'default'
})

// Emits
const emit = defineEmits<{
  favoriteChanged: [isFavorited: boolean]
}>()

// 响应式数据
const isFavorited = ref(false)
const favoriteCount = ref(0)
const loading = ref(false)

// 检查收藏状态
async function checkFavoriteStatus() {
  if (!props.productId) return
  
  try {
    isFavorited.value = await favoriteApi.checkFavorite(props.productId)
  } catch (error) {
    console.error('检查收藏状态失败:', error)
  }
}

// 获取商品收藏数量
async function loadFavoriteCount() {
  if (!props.showCount || !props.productId) return
  
  try {
    favoriteCount.value = await favoriteApi.getProductFavoritesCount(props.productId)
  } catch (error) {
    console.error('获取收藏数量失败:', error)
  }
}

// 切换收藏状态
async function toggleFavorite() {
  if (!props.productId) {
    ElMessage.warning('商品信息不完整')
    return
  }

  // 检查登录状态
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }

  loading.value = true
  
  try {
    if (isFavorited.value) {
      // 取消收藏
      await favoriteApi.removeFavorite(props.productId)
      isFavorited.value = false
      ElMessage.success('取消收藏成功')
      
      // 更新收藏数量
      if (props.showCount) {
        favoriteCount.value = Math.max(0, favoriteCount.value - 1)
      }
    } else {
      // 添加收藏
      await favoriteApi.addFavorite(props.productId)
      isFavorited.value = true
      ElMessage.success('收藏成功')
      
      // 更新收藏数量
      if (props.showCount) {
        favoriteCount.value += 1
      }
    }
    
    // 触发事件
    emit('favoriteChanged', isFavorited.value)
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

// 监听productId变化
watch(() => props.productId, () => {
  if (props.productId) {
    checkFavoriteStatus()
    loadFavoriteCount()
  }
}, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
  if (props.productId) {
    checkFavoriteStatus()
    loadFavoriteCount()
  }
})
</script>

<style scoped>
.favorite-btn {
  transition: all 0.3s ease;
}

.favorite-btn.favorited {
  background-color: #f56565;
  border-color: #f56565;
  color: white;
}

.favorite-btn.favorited:hover {
  background-color: #e53e3e;
  border-color: #e53e3e;
}

.favorite-count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.8;
}
</style>
