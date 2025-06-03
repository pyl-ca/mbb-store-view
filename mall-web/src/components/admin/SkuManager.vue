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
        <el-table-column label="SKU图片" width="100">
          <template #default="{ row, $index }">
            <el-upload
              class="sku-image-uploader"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="(response) => handleSkuImageSuccess(response, $index)"
              :before-upload="beforeImageUpload"
              accept="image/*"
            >
              <img v-if="row.image" :src="getImageUrl(row.image)" class="sku-image" />
              <el-icon v-else class="sku-image-placeholder"><Plus /></el-icon>
            </el-upload>
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

        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <el-input-number
              v-model="row.price"
              :min="0"
              :precision="2"
              placeholder="价格"
            />
          </template>
        </el-table-column>

        <el-table-column label="库存" width="100">
          <template #default="{ row }">
            <el-input-number
              v-model="row.stock"
              :min="0"
              placeholder="库存"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// Props
interface Props {
  modelValue: {
    specList: any[]
    skuList: any[]
  }
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ specList: [], skuList: [] })
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: { specList: any[], skuList: any[] }]
}>()

// 数据定义
const specList = ref<any[]>([])
const skuList = ref<any[]>([])

// 上传配置
const uploadUrl = 'http://localhost:9999/product-service/api/v1/upload/image'
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
    const key = sku.specValueIds?.join(',') || ''
    existingSkus.set(key, sku)
  })

  // 生成新的SKU列表
  skuList.value = combinations.map(combination => {
    const key = combination.specValueIds.join(',')
    const existing = existingSkus.get(key)
    
    return existing || {
      skuName: combination.name,
      price: 0,
      stock: 0,
      image: '',
      status: true,
      specValueIds: combination.specValueIds
    }
  })
}

// 获取规格组合
function getSpecCombinations() {
  const validSpecs = specList.value.filter(spec => 
    spec.name && spec.values.length > 0
  )

  if (validSpecs.length === 0) return []

  let combinations = [{ name: '', specValueIds: [] }]

  validSpecs.forEach((spec, specIndex) => {
    const newCombinations: any[] = []
    
    combinations.forEach(combination => {
      spec.values.forEach((value: any, valueIndex: number) => {
        if (value.value) {
          newCombinations.push({
            name: combination.name ? `${combination.name} ${value.value}` : value.value,
            specValueIds: [...combination.specValueIds, `${specIndex}-${valueIndex}`]
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
  if (!sku.specValueIds) return []
  
  return sku.specValueIds.map((id: string) => {
    const [specIndex, valueIndex] = id.split('-').map(Number)
    const spec = specList.value[specIndex]
    const value = spec?.values[valueIndex]
    return value ? `${spec.name}: ${value.value}` : ''
  }).filter(Boolean)
}

// 手动添加SKU
function addSku() {
  skuList.value.push({
    skuName: '',
    price: 0,
    stock: 0,
    image: '',
    status: true,
    specValueIds: []
  })
}

// 删除SKU
function removeSku(index: number) {
  skuList.value.splice(index, 1)
}

// 获取图片URL
function getImageUrl(imagePath: string) {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  return `http://localhost:9999/static${imagePath}`
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
  if (response.code === '000000') {
    specList.value[specIndex].values[valueIndex].image = response.data.url || response.data.filePath
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.message || '图片上传失败')
  }
}

// SKU图片上传成功
function handleSkuImageSuccess(response: any, skuIndex: number) {
  if (response.code === '000000') {
    skuList.value[skuIndex].image = response.data.url || response.data.filePath
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.message || '图片上传失败')
  }
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
</style>
