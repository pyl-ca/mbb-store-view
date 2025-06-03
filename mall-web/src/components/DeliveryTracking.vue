<template>
  <div class="delivery-tracking">
    <div v-if="loading" class="loading-container">
      <el-loading :loading="true" />
    </div>

    <div v-else-if="deliveryInfo" class="tracking-content">
      <!-- 物流头部信息 -->
      <div class="delivery-header">
        <div class="express-info">
          <h3 class="express-company">{{ deliveryInfo.expressCompany }}</h3>
          <p class="tracking-number">快递单号：{{ deliveryInfo.trackingNumber }}</p>
        </div>
        <el-tag :type="getDeliveryStatusType(deliveryInfo.status)" size="large">
          {{ deliveryInfo.statusName }}
        </el-tag>
      </div>

      <!-- 物流进度时间线 -->
      <div class="tracking-timeline">
        <el-timeline>
          <el-timeline-item
            v-for="(track, index) in deliveryInfo.trackList"
            :key="track.id || index"
            :timestamp="formatTime(track.trackTime)"
            placement="top"
            :type="index === 0 ? 'primary' : 'info'"
            :size="index === 0 ? 'large' : 'normal'"
          >
            <div class="track-content">
              <div class="track-status" :class="{ 'current': index === 0 }">
                {{ track.trackStatus }}
              </div>
              <div class="track-info">{{ track.trackInfo }}</div>
              <div class="track-location" v-if="track.location">
                <el-icon><Location /></el-icon>
                {{ track.location }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 确认收货按钮 -->
      <div class="action-buttons" v-if="showConfirmButton">
        <el-button
          type="primary"
          size="large"
          @click="confirmReceive"
          :loading="confirming"
        >
          确认收货
        </el-button>
        <p class="confirm-tip">
          <el-icon><InfoFilled /></el-icon>
          确认收货后，订单将完成，请确保已收到商品
        </p>
      </div>
    </div>

    <div v-else class="no-tracking">
      <el-empty description="暂无物流信息">
        <el-button @click="refreshTracking">刷新</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, InfoFilled } from '@element-plus/icons-vue'
import axios from 'axios'

interface Props {
  orderSn: string
  orderStatus: number
  showActions?: boolean
}

interface DeliveryInfo {
  deliverySn: string
  orderSn: string
  expressCompany: string
  trackingNumber: string
  status: number
  statusName: string
  trackList: TrackItem[]
}

interface TrackItem {
  id?: number
  trackTime: string
  trackStatus: string
  trackInfo: string
  location?: string
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

const emit = defineEmits<{
  confirmed: []
  refreshed: []
}>()

const loading = ref(false)
const confirming = ref(false)
const deliveryInfo = ref<DeliveryInfo | null>(null)

// 是否显示确认收货按钮
const showConfirmButton = computed(() => {
  return props.showActions &&
         props.orderStatus === 2 && // 已发货状态
         deliveryInfo.value?.status === 1 // 已发货
})

// 页面初始化
onMounted(() => {
  if (props.orderSn) {
    loadDeliveryInfo()
  }
})

// 加载物流信息
async function loadDeliveryInfo() {
  loading.value = true
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')
    const response = await axios.get(
      `http://localhost:9999/order-service/api/v1/delivery/order/${props.orderSn}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    deliveryInfo.value = response.data.data
  } catch (error: any) {
    console.error('加载物流信息失败:', error)
    if (error.response?.status !== 404) {
      ElMessage.error('加载物流信息失败')
    }
  } finally {
    loading.value = false
  }
}

// 刷新物流信息
async function refreshTracking() {
  await loadDeliveryInfo()
  emit('refreshed')
  ElMessage.success('物流信息已刷新')
}

// 确认收货
async function confirmReceive() {
  try {
    await ElMessageBox.confirm(
      '确认收货后，订单将完成，款项将转给商家，请确保已收到商品。',
      '确认收货',
      {
        confirmButtonText: '确认收货',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    confirming.value = true
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')

    await axios.post(
      `http://localhost:9999/order-service/api/v1/delivery/confirm/${props.orderSn}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': getUserId()
        }
      }
    )

    ElMessage.success('确认收货成功')
    emit('confirmed')

    // 刷新物流信息
    await loadDeliveryInfo()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('确认收货失败:', error)
      ElMessage.error(error.response?.data?.msg || '确认收货失败')
    }
  } finally {
    confirming.value = false
  }
}

// 获取用户ID
function getUserId() {
  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      return JSON.parse(userInfo).id
    }
  } catch (error) {
    console.error('获取用户ID失败:', error)
  }
  return ''
}

// 获取物流状态类型
function getDeliveryStatusType(status: number) {
  const types = {
    0: 'warning',  // 待发货
    1: 'primary',  // 已发货
    2: 'primary',  // 运输中
    3: 'success',  // 已签收
    4: 'danger'    // 异常
  }
  return types[status as keyof typeof types] || 'info'
}

// 格式化时间
function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 暴露方法供父组件调用
defineExpose({
  refreshTracking,
  loadDeliveryInfo
})
</script>

<style scoped>
.delivery-tracking {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.loading-container {
  padding: 40px;
  text-align: center;
}

.tracking-content {
  padding: 20px;
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: -20px -20px 20px -20px;
  border-radius: 8px 8px 0 0;
}

.express-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.tracking-number {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.tracking-timeline {
  margin: 20px 0;
}

.track-content {
  padding: 8px 0;
}

.track-status {
  font-weight: 600;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.track-status.current {
  color: #409eff;
}

.track-info {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.track-location {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
}

.action-buttons {
  text-align: center;
  padding: 20px;
  border-top: 1px solid #eee;
  margin: 20px -20px -20px -20px;
}

.confirm-tip {
  margin: 12px 0 0 0;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.no-tracking {
  padding: 40px;
  text-align: center;
}

:deep(.el-timeline-item__timestamp) {
  font-size: 12px;
  color: #999;
}

:deep(.el-timeline-item__node) {
  background-color: #409eff;
}

:deep(.el-timeline-item__wrapper:first-child .el-timeline-item__node) {
  background-color: #67c23a;
}
</style>
