<template>
  <div class="address-container">
    <div class="address-header">
      <h2 class="page-title">我的收货地址</h2>
      <el-button type="primary" @click="showAddressDialog(null)">
        <el-icon><Plus /></el-icon>
        新增地址
      </el-button>
    </div>
    <el-divider />

    <!-- 地址列表 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="addressList.length === 0" class="empty-tip">
      您还没有添加收货地址，请点击"新增地址"按钮添加
    </div>
    <div v-else class="address-list">
      <el-card v-for="item in addressList" :key="item.id" class="address-item" :class="{ 'is-default': item.isDefault === 1 }">
        <div class="address-content">
          <div class="address-info">
            <div class="address-name-phone">
              <span class="address-name">{{ item.name }}</span>
              <span class="address-phone">{{ item.phone }}</span>
              <el-tag v-if="item.isDefault === 1" size="small" type="danger">默认</el-tag>
            </div>
            <div class="address-detail">
              {{ item.fullAddress }}
            </div>
            <div class="address-postal" v-if="item.postalCode">
              邮编: {{ item.postalCode }}
            </div>
          </div>
          <div class="address-actions">
            <el-button type="text" @click="showAddressDialog(item)">编辑</el-button>
            <el-button type="text" @click="deleteAddress(item.id)">删除</el-button>
            <el-button v-if="item.isDefault !== 1" type="text" @click="setDefaultAddress(item.id)">设为默认</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 地址编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑收货地址' : '新增收货地址'"
      width="500px"
    >
      <el-form :model="addressForm" :rules="rules" ref="addressFormRef" label-width="100px">
        <el-form-item label="收货人" prop="name">
          <el-input v-model="addressForm.name" placeholder="请输入收货人姓名" />
        </el-form-item>

        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入手机号码" />
        </el-form-item>

        <el-form-item label="所在地区" prop="region">
          <el-cascader
            v-model="selectedRegion"
            :options="regionOptions"
            :props="{
              expandTrigger: 'hover',
              value: 'code',
              label: 'name',
              children: 'children'
            }"
            placeholder="请选择省/市/区"
            @change="handleRegionChange"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="detailAddress">
          <el-input
            v-model="addressForm.detailAddress"
            type="textarea"
            :rows="2"
            placeholder="请输入详细地址，如街道、门牌号等"
          />
        </el-form-item>

        <el-form-item label="邮政编码" prop="postalCode">
          <el-input v-model="addressForm.postalCode" placeholder="请输入邮政编码" />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault" :true-label="1" :false-label="0">
            设为默认收货地址
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddressForm" :loading="submitLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import type { FormInstance, FormRules } from 'element-plus'

// 地址列表
const addressList = ref<any[]>([])

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)

// 表单引用
const addressFormRef = ref<FormInstance>()

// 地址表单数据
const addressForm = reactive({
  id: 0,
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  postalCode: '',
  isDefault: 0
})

// 表单验证规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  region: [
    {
      validator: (rule, value, callback) => {
        if (selectedRegion.value.length !== 3) {
          callback(new Error('请选择所在地区'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  detailAddress: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '长度在 5 到 100 个字符', trigger: 'blur' }
  ],
  postalCode: [
    { pattern: /^\d{6}$/, message: '请输入正确的邮政编码', trigger: 'blur' }
  ]
})

// 地区选择
const selectedRegion = ref<string[]>([])
const regionOptions = ref<any[]>([])

// 获取地址列表
const fetchAddressList = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('access_token')
    const response = await axios.get('/user-service/api/v1/addresses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.data.code === '000000') {
      addressList.value = response.data.data || []
    } else {
      ElMessage.error(response.data.msg || '获取地址列表失败')
    }
  } catch (error) {
    console.error('获取地址列表失败:', error)
    ElMessage.error('获取地址列表失败')
  } finally {
    loading.value = false
  }
}

// 获取地区数据
const fetchRegionData = async () => {
  try {
    const response = await axios.get('/user-service/api/v1/regions/tree')
    if (response.data.code === '000000') {
      regionOptions.value = response.data.data || []
    }
  } catch (error) {
    console.error('获取地区数据失败:', error)
  }
}

// 显示地址对话框
const showAddressDialog = (address: any) => {
  resetAddressForm()

  if (address) {
    isEdit.value = true
    Object.keys(addressForm).forEach(key => {
      if (key in address) {
        addressForm[key] = address[key]
      }
    })

    // 设置地区选择器的值
    if (address.province && address.city && address.district) {
      console.log('编辑地址:', address)
      // 查找省市区对应的编码
      findRegionCodes(address.province, address.city, address.district)
    }
  } else {
    isEdit.value = false
  }

  dialogVisible.value = true
}

// 根据省市区名称查找对应的编码
const findRegionCodes = (provinceName: string, cityName: string, districtName: string) => {
  // 清空之前的选择
  selectedRegion.value = []

  // 等待地区数据加载完成
  if (regionOptions.value.length === 0) {
    console.log('地区数据尚未加载完成')
    return
  }

  console.log('查找地区编码:', provinceName, cityName, districtName)
  console.log('可用地区数据:', regionOptions.value)

  // 查找省份编码
  const province = regionOptions.value.find(p => p.name === provinceName)
  if (!province) {
    console.log('未找到省份:', provinceName)
    return
  }

  // 查找城市编码
  const city = province.children?.find((c: any) => c.name === cityName)
  if (!city) {
    console.log('未找到城市:', cityName)
    return
  }

  // 查找区县编码
  const district = city.children?.find((d: any) => d.name === districtName)
  if (!district) {
    console.log('未找到区县:', districtName)
    return
  }

  // 设置选中的地区编码
  selectedRegion.value = [province.code, city.code, district.code]
  console.log('设置地区选择器的值:', selectedRegion.value)
}

// 重置地址表单
const resetAddressForm = () => {
  if (addressFormRef.value) {
    addressFormRef.value.resetFields()
  }

  Object.keys(addressForm).forEach(key => {
    if (key === 'isDefault') {
      addressForm[key] = 0
    } else if (key === 'id') {
      addressForm[key] = 0
    } else {
      addressForm[key] = ''
    }
  })

  selectedRegion.value = []
}

// 处理地区选择变化
const handleRegionChange = (value: string[]) => {
  if (value.length === 3) {
    // 根据选择的地区编码，找到对应的地区名称
    const findRegionName = (code: string, level: number): string => {
      if (level === 0) {
        const province = regionOptions.value.find(item => item.code === code)
        return province ? province.name : ''
      } else if (level === 1) {
        const province = regionOptions.value.find(item => item.code === value[0])
        if (province && province.children) {
          const city = province.children.find(item => item.code === code)
          return city ? city.name : ''
        }
      } else if (level === 2) {
        const province = regionOptions.value.find(item => item.code === value[0])
        if (province && province.children) {
          const city = province.children.find(item => item.code === value[1])
          if (city && city.children) {
            const district = city.children.find(item => item.code === code)
            return district ? district.name : ''
          }
        }
      }
      return ''
    }

    addressForm.province = findRegionName(value[0], 0)
    addressForm.city = findRegionName(value[1], 1)
    addressForm.district = findRegionName(value[2], 2)
  }
}

// 提交地址表单
const submitAddressForm = async () => {
  if (!addressFormRef.value) return

  try {
    // 检查地区选择是否完整
    if (selectedRegion.value.length !== 3) {
      ElMessage.error('请选择完整的省市区')
      return
    }

    // 验证表单
    await addressFormRef.value.validate()
    submitLoading.value = true

    // 打印提交的数据，用于调试
    console.log('提交的地址数据:', addressForm)

    const token = localStorage.getItem('access_token')
    let response

    if (isEdit.value) {
      // 更新地址 - 不需要在URL中包含ID，ID包含在请求体中
      response = await axios.put('/user-service/api/v1/addresses', addressForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    } else {
      // 新增地址
      response = await axios.post('/user-service/api/v1/addresses', addressForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    }

    console.log('地址保存响应:', response.data)

    if (response.data.code === '000000') {
      ElMessage.success(isEdit.value ? '地址更新成功' : '地址添加成功')
      dialogVisible.value = false
      fetchAddressList()
    } else {
      ElMessage.error(response.data.msg || (isEdit.value ? '地址更新失败' : '地址添加失败'))
    }
  } catch (error) {
    console.error(isEdit.value ? '更新地址失败:' : '添加地址失败:', error)
    ElMessage.error(isEdit.value ? '更新地址失败' : '添加地址失败')
  } finally {
    submitLoading.value = false
  }
}

// 删除地址
const deleteAddress = (id: number) => {
  ElMessageBox.confirm('确定要删除这个地址吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.delete(`/user-service/api/v1/addresses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.code === '000000') {
        ElMessage.success('地址删除成功')
        fetchAddressList()
      } else {
        ElMessage.error(response.data.msg || '地址删除失败')
      }
    } catch (error) {
      console.error('删除地址失败:', error)
      ElMessage.error('删除地址失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 设置默认地址
const setDefaultAddress = async (id: number) => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await axios.put(`/user-service/api/v1/addresses/${id}/default`, null, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.data.code === '000000') {
      ElMessage.success('默认地址设置成功')
      fetchAddressList()
    } else {
      ElMessage.error(response.data.msg || '默认地址设置失败')
    }
  } catch (error) {
    console.error('设置默认地址失败:', error)
    ElMessage.error('设置默认地址失败')
  }
}

onMounted(() => {
  fetchAddressList()
  fetchRegionData()
})
</script>

<style scoped>
.address-container {
  width: 100%;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.loading-container {
  padding: 20px 0;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.address-item {
  position: relative;
  transition: all 0.3s;
}

.address-item.is-default {
  border: 1px solid #ff4d4f;
}

.address-content {
  display: flex;
  flex-direction: column;
}

.address-info {
  flex: 1;
}

.address-name-phone {
  margin-bottom: 10px;
}

.address-name {
  font-weight: bold;
  margin-right: 10px;
}

.address-phone {
  color: #666;
}

.address-detail {
  margin-bottom: 5px;
  color: #333;
  line-height: 1.5;
}

.address-postal {
  color: #999;
  font-size: 12px;
}

.address-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}
</style>
