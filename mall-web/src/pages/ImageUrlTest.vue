<template>
  <div class="image-url-test">
    <h2>图片URL测试页面</h2>
    
    <div class="test-section">
      <h3>环境变量检查</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>VITE_API_BASE_URL:</strong> {{ envApiBaseUrl }}
        </div>
        <div class="info-item">
          <strong>实际使用的API_BASE_URL:</strong> {{ actualApiBaseUrl }}
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>退款图片URL测试</h3>
      <div class="test-input">
        <el-input 
          v-model="testImagePath" 
          placeholder="输入图片路径进行测试"
          style="width: 400px; margin-right: 10px;"
        />
        <el-button @click="testImageUrl" type="primary">测试URL生成</el-button>
      </div>
      
      <div v-if="generatedUrl" class="result-section">
        <h4>生成的图片URL：</h4>
        <div class="url-display">{{ generatedUrl }}</div>
        <div class="image-preview">
          <el-image
            :src="generatedUrl"
            style="width: 200px; height: 200px;"
            fit="cover"
          >
            <template #error>
              <div class="image-error">
                <span>图片加载失败</span>
              </div>
            </template>
          </el-image>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>常见路径测试</h3>
      <div class="path-tests">
        <div v-for="(path, index) in testPaths" :key="index" class="path-test">
          <div class="path-input">输入: {{ path }}</div>
          <div class="path-output">输出: {{ getRefundImageUrl(path) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getRefundImageUrl } from '../utils/imageUtils'

const envApiBaseUrl = ref('')
const actualApiBaseUrl = ref('')
const testImagePath = ref('/uploads/refund/refund_20250530174928839.jpg')
const generatedUrl = ref('')

const testPaths = [
  '/uploads/refund/refund_20250530174928839.jpg',
  'uploads/refund/refund_20250530174928839.jpg',
  'refund_20250530174928839.jpg',
  '/refund/refund_20250530174928839.jpg',
  '/payment-service/uploads/refund/refund_20250530174928839.jpg'
]

onMounted(() => {
  // 获取环境变量
  envApiBaseUrl.value = import.meta.env.VITE_API_BASE_URL || '未设置'
  
  // 测试实际使用的API_BASE_URL
  const testUrl = getRefundImageUrl('test.jpg')
  const match = testUrl.match(/^(https?:\/\/[^\/]+)/)
  actualApiBaseUrl.value = match ? match[1] : '无法解析'
  
  // 默认测试
  testImageUrl()
})

function testImageUrl() {
  if (testImagePath.value) {
    generatedUrl.value = getRefundImageUrl(testImagePath.value)
  }
}
</script>

<style scoped>
.image-url-test {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.info-grid {
  display: grid;
  gap: 10px;
}

.info-item {
  padding: 10px;
  background: white;
  border-radius: 4px;
}

.test-input {
  margin-bottom: 20px;
}

.result-section {
  margin-top: 20px;
}

.url-display {
  padding: 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
  margin-bottom: 10px;
}

.image-preview {
  margin-top: 10px;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f5f5;
  color: #999;
}

.path-tests {
  display: grid;
  gap: 15px;
}

.path-test {
  padding: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.path-input {
  font-weight: bold;
  color: #666;
  margin-bottom: 5px;
}

.path-output {
  font-family: monospace;
  color: #333;
  word-break: break-all;
}
</style>
