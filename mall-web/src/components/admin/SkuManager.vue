<template>
  <div class="sku-manager">
    <!-- 规格定义 -->
    <el-card class="spec-section" header="商品规格">
      <div class="spec-list">
        <div v-for="(spec, specIndex) in specList" :key="specIndex" class="spec-item">
          <div class="spec-header">
            <el-input
              v-model="spec.name"
              placeholder="规格名称（如：颜色、尺寸）"
              style="width: 200px"
            />
            <el-input-number
              v-model="spec.sort"
              :min="0"
              :max="999"
              placeholder="排序"
              style="width: 100px; margin-left: 10px"
            />
            <el-button
              type="danger"
              size="small"
              @click="removeSpec(specIndex)"
              style="margin-left: 10px"
            >
              删除规格
            </el-button>
          </div>

          <div class="spec-values">
            <div v-for="(value, valueIndex) in spec.values" :key="valueIndex" class="spec-value-item">
              <el-input
                v-model="value.value"
                placeholder="规格值（如：红色、L码）"
                style="width: 150px"
              />
              <el-input-number
                v-model="value.sort"
                :min="0"
                :max="999"
                placeholder="排序"
                style="width: 80px; margin-left: 10px"
              />
              <el-upload
                class="value-image-uploader"
                :action="uploadUrl"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="(response) => handleValueImageSuccess(response, specIndex, valueIndex)"
                :before-upload="beforeImageUpload"
                accept="image/*"
                style="margin-left: 10px"
              >
                <img v-if="value.image" :src="getImageUrl(value.image)" class="value-image" />
                <el-button v-else size="small" type="primary">上传图片</el-button>
              </el-upload>
              <el-button
                type="danger"
                size="small"
                @click="removeSpecValue(specIndex, valueIndex)"
                style="margin-left: 10px"
              >
                删除
              </el-button>
            </div>
            <el-button
              type="primary"
              size="small"
              @click="addSpecValue(specIndex)"
              style="margin-top: 10px"
            >
              添加规格值
            </el-button>
          </div>
        </div>
      </div>

      <el-button type="primary" @click="addSpec" style="margin-top: 20px">
        添加规格
      </el-button>
      <el-button type="success" @click="generateSkus" style="margin-left: 10px">
        生成SKU
      </el-button>
    </el-card>

    <!-- SKU列表 -->
    <el-card class="sku-section" header="SKU管理" style="margin-top: 20px">
      <el-table :data="skuList" border>
        <el-table-column label="SKU图片" width="120">
          <template #default="{ row, $index }">
            <div class="sku-image-selector">
              <!-- 当前选中的图片 -->
              <div class="current-image" @click="openImageSelector($index)">
                <img v-if="row.image" :src="getImageUrl(row.image)" class="sku-image" />
                <div v-else class="sku-image-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>选择图片</span>
                </div>
              </div>
              <!-- 图片选择按钮 -->
              <el-button
                size="small"
                type="primary"
                @click="openImageSelector($index)"
                style="margin-top: 5px; width: 100%"
              >
                {{ row.image ? '更换图片' : '选择图片' }}
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="SKU名称" width="200">
          <template #default="{ row }">
            <el-input v-model="row.skuName" placeholder="SKU名称" />
          </template>
        </el-table-column>

        <el-table-column label="规格组合" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="(specValue, index) in getSkuSpecValues(row)"
              :key="index"
              size="small"
              style="margin-right: 5px"
            >
              {{ specValue }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="价格" width="180">
          <template #default="{ row }">
            <el-input-number
              v-model="row.price"
              :min="0"
              :precision="2"
              placeholder="价格"
              style="width: 100%; height: 40px; font-size: 14px;"
              :controls-position="'right'"
              size="large"
            />
          </template>
        </el-table-column>

        <el-table-column label="库存" width="150">
          <template #default="{ row }">
            <el-input-number
              v-model="row.stock"
              :min="0"
              placeholder="库存"
              style="width: 100%; height: 40px; font-size: 14px;"
              :controls-position="'right'"
              size="large"
            />
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.status" />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100">
          <template #default="{ $index }">
            <el-button
              type="danger"
              size="small"
              @click="removeSku($index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-button type="primary" @click="addSku" style="margin-top: 20px">
        手动添加SKU
      </el-button>
    </el-card>

    <!-- 图片选择对话框 -->
    <el-dialog
      v-model="imageSelectDialogVisible"
      title="选择SKU图片"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="image-selector-content">
        <div v-if="props.detailImages && props.detailImages.length > 0" class="detail-images-grid">
          <div class="section-title">从详情图中选择：</div>
          <div class="images-grid">
            <div
              v-for="(image, index) in props.detailImages"
              :key="index"
              class="image-item"
              :class="{ 'selected': selectedImageForSku === image }"
              @click="selectImageForSku(image)"
            >
              <img :src="getImageUrl(image)" :alt="`详情图 ${index + 1}`" />
              <div class="image-overlay">
                <el-icon v-if="selectedImageForSku === image" class="check-icon">
                  <Check />
                </el-icon>
              </div>
              <div class="image-label">详情图 {{ index + 1 }}</div>
            </div>
          </div>
        </div>

        <div v-else class="no-images">
          <el-empty description="暂无详情图片">
            <template #description>
              <p>请先上传商品详情图片，然后再为SKU选择图片</p>
            </template>
          </el-empty>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelImageSelection">取消</el-button>
          <el-button
            type="primary"
            @click="confirmImageSelection"
            :disabled="!selectedImageForSku"
          >
            确认选择
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Check } from '@element-plus/icons-vue'

// Props
interface Props {
  modelValue: {
    specList: any[]
    skuList: any[]
  }
  detailImages?: string[]  // 已上传的详情图列表
  productId?: string | number  // 商品ID
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ specList: [], skuList: [] }),
  detailImages: () => [],
  productId: undefined
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: { specList: any[], skuList: any[] }]
}>()

// 数据定义
const specList = ref<any[]>([])
const skuList = ref<any[]>([])

// 图片选择相关数据
const imageSelectDialogVisible = ref(false)
const currentSkuIndex = ref(-1)
const selectedImageForSku = ref('')

// 导入API配置
import { API_BASE_URL } from '../../api/config'

// 上传配置 - 根据环境动态设置
const uploadUrl = `${API_BASE_URL}/product-service/api/v1/upload/image`
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}`
}))

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    specList.value = newVal.specList || []
    skuList.value = newVal.skuList || []
  }
}, { immediate: true, deep: true })

// 监听数据变化，向上传递
watch([specList, skuList], () => {
  emit('update:modelValue', {
    specList: specList.value,
    skuList: skuList.value
  })
}, { deep: true })

// 添加规格
function addSpec() {
  specList.value.push({
    name: '',
    sort: 0,
    values: []
  })
}

// 删除规格
function removeSpec(index: number) {
  specList.value.splice(index, 1)
  generateSkus() // 重新生成SKU
}

// 添加规格值
function addSpecValue(specIndex: number) {
  specList.value[specIndex].values.push({
    value: '',
    image: '',
    sort: 0
  })
}

// 删除规格值
function removeSpecValue(specIndex: number, valueIndex: number) {
  specList.value[specIndex].values.splice(valueIndex, 1)
  generateSkus() // 重新生成SKU
}

// 生成SKU
function generateSkus() {
  if (specList.value.length === 0) {
    skuList.value = []
    return
  }

  // 获取所有规格值的组合
  const combinations = getSpecCombinations()

  // 保留已有SKU的数据
  const existingSkus = new Map()
  skuList.value.forEach(sku => {
    // 使用SKU名称作为唯一标识
    const key = sku.skuName
    existingSkus.set(key, sku)
  })

  // 生成新的SKU列表
  skuList.value = combinations.map(combination => {
    const existing = existingSkus.get(combination.name)

    return existing || {
      skuName: combination.name,
      price: 0,
      stock: 0,
      image: '',
      status: true
    }
  })
}

// 获取规格组合
function getSpecCombinations() {
  const validSpecs = specList.value.filter(spec =>
    spec.name && spec.values.length > 0
  )

  if (validSpecs.length === 0) return []

  let combinations = [{ name: '' }]

  validSpecs.forEach((spec) => {
    const newCombinations: any[] = []

    combinations.forEach(combination => {
      spec.values.forEach((value: any) => {
        if (value.value) {
          newCombinations.push({
            name: combination.name ? `${combination.name} ${value.value}` : value.value
          })
        }
      })
    })

    combinations = newCombinations
  })

  return combinations
}

// 获取SKU的规格值显示
function getSkuSpecValues(sku: any) {
  // 直接使用SKU名称显示，因为SKU名称已经包含了所有规格值信息
  return sku.skuName ? [sku.skuName] : []
}

// 手动添加SKU
function addSku() {
  skuList.value.push({
    skuName: '',
    price: 0,
    stock: 0,
    image: '',
    status: true
  })
}

// 删除SKU
function removeSku(index: number) {
  skuList.value.splice(index, 1)
}

// 获取图片URL
function getImageUrl(imagePath: string) {
  console.log('🔍 SkuManager获取图片URL，原始路径:', imagePath)

  if (!imagePath) return ''
  if (imagePath.startsWith('http')) {
    console.log('✅ 已是完整URL:', imagePath)
    return imagePath
  }

  // 使用环境变量配置的API基础URL
  const baseUrl = API_BASE_URL

  // 如果是相对路径，拼接完整URL
  let fullUrl = ''
  if (imagePath.startsWith('/static/')) {
    // 如果已经包含 /static/ 前缀，直接拼接
    fullUrl = `${baseUrl}${imagePath}`
  } else if (imagePath.startsWith('/')) {
    // 如果是以 / 开头的路径，添加 /static 前缀
    fullUrl = `${baseUrl}/static${imagePath}`
  } else {
    // 如果是相对路径，添加 /static/ 前缀
    fullUrl = `${baseUrl}/static/${imagePath}`
  }

  console.log('🔗 SkuManager生成的完整URL:', fullUrl)
  return fullUrl
}

// 图片上传前验证
function beforeImageUpload(file: any) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 规格值图片上传成功
function handleValueImageSuccess(response: any, specIndex: number, valueIndex: number) {
  console.log('🔍 规格值图片上传响应:', response)

  // 兼容多种成功状态码格式
  const isSuccess = response.code === '000000' ||
                   response.code === 200 ||
                   response.code === '200' ||
                   response.success === true

  if (isSuccess) {
    let imageUrl = response.data?.url || response.data?.fullUrl || response.data?.relativePath || response.data?.filePath

    // 根据网关配置，静态资源应该通过 /static/** 路径访问
    if (imageUrl && imageUrl.startsWith('http')) {
      // 提取文件名
      const urlParts = imageUrl.split('/')
      const filename = urlParts[urlParts.length - 1]

      // 转换为静态资源路径
      imageUrl = `${API_BASE_URL}/static/images/product/${filename}`
      console.log('🔧 规格值图片转换为静态资源路径:', imageUrl)
    }

    specList.value[specIndex].values[valueIndex].image = imageUrl
    console.log('✅ 规格值图片上传成功，存储路径:', imageUrl)
    ElMessage.success('图片上传成功')
  } else {
    console.error('❌ 规格值图片上传失败:', response)
    ElMessage.error(response.message || response.msg || '图片上传失败')
  }
}

// 打开图片选择器
function openImageSelector(skuIndex: number) {
  if (!props.detailImages || props.detailImages.length === 0) {
    ElMessage.warning('请先上传商品详情图片')
    return
  }

  currentSkuIndex.value = skuIndex
  selectedImageForSku.value = skuList.value[skuIndex].image || ''
  imageSelectDialogVisible.value = true
}

// 选择图片
function selectImageForSku(imageUrl: string) {
  selectedImageForSku.value = imageUrl
}

// 确认选择图片
function confirmImageSelection() {
  if (currentSkuIndex.value >= 0 && selectedImageForSku.value) {
    skuList.value[currentSkuIndex.value].image = selectedImageForSku.value
    console.log('✅ SKU图片选择成功:', selectedImageForSku.value)
    ElMessage.success('图片选择成功')
  }

  // 关闭对话框
  imageSelectDialogVisible.value = false
  currentSkuIndex.value = -1
  selectedImageForSku.value = ''
}

// 取消选择图片
function cancelImageSelection() {
  imageSelectDialogVisible.value = false
  currentSkuIndex.value = -1
  selectedImageForSku.value = ''
}
</script>

<style scoped>
.sku-manager {
  width: 100%;
}

.spec-section,
.sku-section {
  margin-bottom: 20px;
}

.spec-section :deep(.el-card__header),
.sku-section :deep(.el-card__header) {
  background-color: #f5f7fa;
  font-weight: bold;
}

.spec-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fafafa;
}

.spec-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.spec-values {
  margin-left: 20px;
}

.spec-value-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.value-image-uploader {
  display: inline-block;
}

.value-image {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.sku-image-uploader {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.sku-image-uploader:hover {
  border-color: #409eff;
}

.sku-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.sku-image-placeholder {
  font-size: 20px;
  color: #8c939d;
}

.el-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.el-input-number {
  width: 100%;
}

/* 图片选择器样式 */
.sku-image-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.current-image {
  width: 80px;
  height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
  margin-bottom: 5px;
}

.current-image:hover {
  border-color: #409eff;
}

.sku-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.sku-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #8c939d;
  font-size: 12px;
}

.sku-image-placeholder .el-icon {
  font-size: 20px;
  margin-bottom: 5px;
}

/* 图片选择对话框样式 */
.image-selector-content {
  max-height: 500px;
  overflow-y: auto;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.image-item {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.image-item:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.image-item.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.image-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(64, 158, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item.selected .image-overlay {
  opacity: 1;
}

.check-icon {
  color: white;
  font-size: 24px;
}

.image-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  text-align: center;
  padding: 5px;
  font-size: 12px;
}

.no-images {
  text-align: center;
  padding: 40px 20px;
}

.dialog-footer {
  text-align: right;
}
</style>
