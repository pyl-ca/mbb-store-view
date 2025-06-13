<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="isEdit ? '编辑商品' : '新增商品'"
    width="80%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="product-form"
    >
      <!-- 基本信息 -->
      <el-card class="form-section" header="基本信息">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品副标题" prop="subTitle">
              <el-input v-model="form.subTitle" placeholder="请输入商品副标题" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品分类" prop="categoryId">
              <el-tree-select
                v-model="form.categoryId"
                :data="categoryOptions"
                :props="{ value: 'id', label: 'name', children: 'children' }"
                placeholder="请选择商品分类"
                clearable
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品品牌" prop="brand">
              <el-input v-model="form.brand" placeholder="请输入商品品牌" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="商品单位" prop="unit">
              <el-input v-model="form.unit" placeholder="如：台、个、件" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="商品状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="true">上架</el-radio>
                <el-radio :label="false">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="推荐商品" prop="recommend">
              <el-radio-group v-model="form.recommend">
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 价格信息 -->
      <el-card class="form-section" header="价格信息">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="现价" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="原价" prop="originalPrice">
              <el-input-number v-model="form.originalPrice" :min="0" :precision="2" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="市场价" prop="marketPrice">
              <el-input-number v-model="form.marketPrice" :min="0" :precision="2" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="会员价" prop="memberPrice">
              <el-input-number v-model="form.memberPrice" :min="0" :precision="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 库存信息 -->
      <el-card class="form-section" header="库存信息">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库存数量" prop="stock">
              <el-input-number v-model="form.stock" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警库存" prop="warningStock">
              <el-input-number v-model="form.warningStock" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 商品图片 -->
      <el-card class="form-section" header="商品图片">
        <el-form-item label="商品主图" prop="image">
          <div class="image-upload-section">
            <el-upload
              class="image-uploader"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleImageSuccess"
              :before-upload="beforeImageUpload"
              accept="image/*"
            >
              <img v-if="form.image" :src="getImageUrl(form.image)" class="uploaded-image" />
              <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tips">
              <p>点击上传商品主图</p>
              <p>建议尺寸：800x800px，支持jpg、png格式</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="详情图片" prop="detailImages">
          <div class="detail-images-section">
            <el-upload
              class="detail-image-uploader"
              :action="detailUploadUrl"
              :headers="uploadHeaders"
              :file-list="detailImageList"
              :on-success="handleDetailImageSuccess"
              :on-remove="handleDetailImageRemove"
              :before-upload="beforeImageUpload"
              accept="image/*"
              multiple
              list-type="picture-card"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tips">
              <p>上传商品详情图片，可多张</p>
              <p>建议尺寸：750px宽度，支持jpg、png格式</p>
            </div>
          </div>
        </el-form-item>
      </el-card>

      <!-- 商品描述 -->
      <el-card class="form-section" header="商品描述">
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="6"
            placeholder="请输入商品详细描述"
          />
        </el-form-item>
      </el-card>

      <!-- SKU和规格管理 -->
      <el-card class="form-section" header="SKU和规格管理">
        <SkuManager :model-value="skuData" @update:model-value="skuData = $event" />
      </el-card>

      <!-- 定时上下架 -->
      <el-card class="form-section" header="定时设置">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="定时上架" prop="scheduledOnTime">
              <el-date-picker
                v-model="form.scheduledOnTime"
                type="datetime"
                placeholder="选择定时上架时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="定时下架" prop="scheduledOffTime">
              <el-date-picker
                v-model="form.scheduledOffTime"
                type="datetime"
                placeholder="选择定时下架时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import SkuManager from './SkuManager.vue'

// Props
interface Props {
  visible: boolean
  productData?: any
  categories: any[]
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  productData: null,
  categories: () => []
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

// 数据定义
const formRef = ref<FormInstance>()
const submitLoading = ref(false)

// 表单数据
const form = reactive({
  id: undefined as number | undefined,
  name: '',
  subTitle: '',
  categoryId: undefined as number | undefined,
  brand: '',
  unit: '件',
  sort: 0,
  status: true,
  recommend: false,
  price: 0,
  originalPrice: 0,
  marketPrice: 0,
  memberPrice: 0,
  stock: 0,
  warningStock: 5,
  image: '',
  detailImages: [] as string[],
  description: '',
  scheduledOnTime: '',
  scheduledOffTime: ''
})

// 详情图片列表
const detailImageList = ref<any[]>([])

// SKU数据
const skuData = ref({
  specList: [] as any[],
  skuList: [] as any[]
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 100, message: '商品名称长度为2-100个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '商品价格必须大于0', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存数量不能小于0', trigger: 'blur' }
  ]
}

// 计算属性
const isEdit = computed(() => !!form.id)

// 分类选项
const categoryOptions = computed(() => {
  return props.categories
})

// 导入API配置
import { API_BASE_URL } from '../../api/config'

// 上传配置 - 根据环境动态设置
// 🔧 修复：使用正确的后端接口路径
const uploadUrl = `${API_BASE_URL}/product-service/api/v1/upload/image`
const detailUploadUrl = `${API_BASE_URL}/product-service/api/v1/upload/product/detail`

// 🔍 调试信息
console.log('🔧 ProductForm 上传配置:')
console.log('🔧 API_BASE_URL:', API_BASE_URL)
console.log('🔧 主图上传URL:', uploadUrl)
console.log('🔧 详情图上传URL:', detailUploadUrl)

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}`
}))

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal && props.productData) {
    // 编辑模式，填充数据
    Object.assign(form, props.productData)
    updateDetailImageList()
    updateSkuData()
  } else if (newVal) {
    // 新增模式，重置表单
    resetForm()
  }
})

// 重置表单
function resetForm() {
  Object.assign(form, {
    id: undefined,
    name: '',
    subTitle: '',
    categoryId: undefined,
    brand: '',
    unit: '件',
    sort: 0,
    status: true,
    recommend: false,
    price: 0,
    originalPrice: 0,
    marketPrice: 0,
    memberPrice: 0,
    stock: 0,
    warningStock: 5,
    image: '',
    detailImages: [],
    description: '',
    scheduledOnTime: '',
    scheduledOffTime: ''
  })
  detailImageList.value = []
  skuData.value = {
    specList: [] as any[],
    skuList: [] as any[]
  }
}

// 更新详情图片列表
function updateDetailImageList() {
  detailImageList.value = form.detailImages.map((url, index) => ({
    name: `detail-${index}`,
    url: getImageUrl(url)
  }))
}

// 更新SKU数据
function updateSkuData() {
  // 处理规格列表中的图片路径
  const processedSpecList = (props.productData?.specList || []).map((spec: any) => ({
    ...spec,
    values: (spec.values || []).map((value: any) => ({
      ...value,
      image: value.image ? getImageUrl(value.image) : value.image
    }))
  }))

  // 处理SKU列表中的图片路径
  const processedSkuList = (props.productData?.skuList || []).map((sku: any) => ({
    ...sku,
    image: sku.image ? getImageUrl(sku.image) : sku.image
  }))

  skuData.value = {
    specList: processedSpecList,
    skuList: processedSkuList
  }
}

// 获取图片URL - 用于显示图片
function getImageUrl(imagePath: string) {
  console.log('🔍 ProductForm获取图片URL，原始路径:', imagePath)

  if (!imagePath) return ''
  if (imagePath.startsWith('http')) {
    console.log('✅ 已是完整URL:', imagePath)
    return imagePath
  }

  // 使用环境变量配置的API基础URL
  const baseUrl = API_BASE_URL

  // 根据网关配置，商品图片通过 /static/** 路径访问
  let fullUrl = ''

  if (imagePath.startsWith('/images/product/')) {
    // 标准格式：/images/product/uuid.jpg -> /static/images/product/uuid.jpg
    fullUrl = `${baseUrl}/static${imagePath}`
  } else if (imagePath.startsWith('/images/')) {
    // 当前后端返回格式：/images/20250610/uuid.png -> /static/images/20250610/uuid.png
    fullUrl = `${baseUrl}/static${imagePath}`
  } else if (imagePath.startsWith('/static/')) {
    // 已包含static前缀，直接使用
    fullUrl = `${baseUrl}${imagePath}`
  } else {
    // 其他格式，默认添加 /static/images/product/ 前缀
    fullUrl = `${baseUrl}/static/images/product/${imagePath}`
  }

  console.log('🔗 ProductForm生成的显示URL:', fullUrl)
  return fullUrl
}

// 图片上传前验证
function beforeImageUpload(file: any) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 主图上传成功
function handleImageSuccess(response: any) {
  console.log('🔍 主图上传响应:', response)
  console.log('🔍 响应码类型:', typeof response.code, '值:', response.code)

  // 兼容多种成功状态码格式
  const isSuccess = response.code === '000000' ||
                   response.code === 200 ||
                   response.code === '200' ||
                   response.success === true

  if (isSuccess) {
    // 根据文档，优先使用 relativePath 或 url 字段
    let imagePath = response.data?.relativePath || response.data?.url || response.data?.fullUrl || response.data?.filePath

    console.log('🔍 后端返回的路径:', imagePath)

    if (imagePath) {
      // 🔧 关键修复：只保存相对路径到数据库，不保存完整URL
      console.log('🔧 保存相对路径到表单:', imagePath)

      // 只保存相对路径，如：/images/product/uuid文件名.jpg
      form.image = imagePath
    }

    console.log('✅ 主图上传成功，存储路径:', form.image)
    ElMessage.success('图片上传成功')
  } else {
    console.error('❌ 主图上传失败:', response)
    ElMessage.error(response.message || response.msg || '图片上传失败')
  }
}

// 详情图片上传成功
function handleDetailImageSuccess(response: any) {
  console.log('🔍 详情图片上传响应:', response)
  console.log('🔍 响应码类型:', typeof response.code, '值:', response.code)

  // 兼容多种成功状态码格式
  const isSuccess = response.code === '000000' ||
                   response.code === 200 ||
                   response.code === '200' ||
                   response.success === true

  if (isSuccess) {
    // 根据文档，优先使用 relativePath 或 url 字段
    let imagePath = response.data?.relativePath || response.data?.url || response.data?.fullUrl || response.data?.filePath

    console.log('🔍 详情图片后端返回路径:', imagePath)

    if (imagePath) {
      // 🔧 关键修复：只保存相对路径到数据库，不保存完整URL
      console.log('🔧 详情图片保存相对路径:', imagePath)

      // 只保存相对路径，如：/images/product/uuid文件名.jpg
      form.detailImages.push(imagePath)
    }

    console.log('✅ 详情图片上传成功')
    ElMessage.success('图片上传成功')
  } else {
    console.error('❌ 详情图片上传失败:', response)
    ElMessage.error(response.message || response.msg || '图片上传失败')
  }
}

// 删除详情图片
function handleDetailImageRemove(file: any) {
  const index = detailImageList.value.findIndex(item => item.uid === file.uid)
  if (index > -1) {
    form.detailImages.splice(index, 1)
  }
}

// 处理关闭
function handleClose() {
  emit('update:visible', false)
}

// 处理提交
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    // 合并表单数据和SKU数据
    const submitData = {
      ...form,
      specList: skuData.value.specList,
      skuList: skuData.value.skuList
    }

    const url = isEdit.value
      ? `/product-service/api/v1/admin/products/${form.id}`
      : '/product-service/api/v1/admin/products'

    const method = isEdit.value ? 'put' : 'post'

    await axios[method](url, submitData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` }
    })

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    emit('success')
    handleClose()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.product-form {
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 20px;
}

.form-section :deep(.el-card__header) {
  background-color: #f5f7fa;
  font-weight: bold;
}

.image-upload-section {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.image-uploader:hover {
  border-color: #409eff;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.uploaded-image {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}

.detail-images-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-image-uploader :deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
}

.upload-tips {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.upload-tips p {
  margin: 0;
}

.dialog-footer {
  text-align: right;
}
</style>
