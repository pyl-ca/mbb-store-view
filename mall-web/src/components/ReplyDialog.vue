<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="500px"
    :before-close="handleClose"
  >
    <!-- 原评论信息 -->
    <div v-if="reviewInfo" class="original-review">
      <div class="review-header">
        <el-avatar :src="reviewInfo.userAvatar" :size="32">
          {{ reviewInfo.userNickname?.charAt(0) }}
        </el-avatar>
        <div class="review-user">
          <span class="username">{{ reviewInfo.userNickname }}</span>
          <el-rate :model-value="reviewInfo.rating" disabled size="small" />
        </div>
      </div>
      <p class="review-content">{{ reviewInfo.content }}</p>
    </div>

    <!-- 被回复的内容 -->
    <div v-if="parentReply" class="parent-reply">
      <div class="reply-header">
        <el-avatar :src="parentReply.userAvatar" :size="24">
          {{ parentReply.userNickname?.charAt(0) }}
        </el-avatar>
        <span class="reply-username">{{ parentReply.userNickname }}</span>
        <el-tag v-if="parentReply.isMerchant" type="warning" size="small">商家</el-tag>
      </div>
      <p class="reply-content">{{ parentReply.content }}</p>
    </div>

    <!-- 回复表单 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="0"
    >
      <el-form-item prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="4"
          :placeholder="placeholder"
          maxlength="500"
          show-word-limit
          autofocus
        />
      </el-form-item>

      <!-- 商家回复选项 -->
      <el-form-item v-if="canMerchantReply">
        <el-checkbox v-model="formData.isMerchant">
          以商家身份回复
        </el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          发布回复
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { reviewApi } from '../api/review'
import type { Review, Reply, CreateReplyRequest } from '../types/review'

interface Props {
  modelValue: boolean
  reviewInfo?: Review
  parentReply?: Reply
  canMerchantReply?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(false)
const formRef = ref()
const submitting = ref(false)

const formData = reactive({
  content: '',
  isMerchant: false
})

const rules = {
  content: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 2, message: '回复内容至少2个字符', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  if (props.parentReply) {
    return `回复 @${props.parentReply.userNickname}`
  }
  return '回复评论'
})

const placeholder = computed(() => {
  if (props.parentReply) {
    return `回复 @${props.parentReply.userNickname}...`
  }
  return '请输入回复内容...'
})

// 监听弹窗显示状态
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// 提交回复
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    if (!props.reviewInfo) {
      ElMessage.error('缺少评论信息')
      return
    }

    submitting.value = true

    const replyData: CreateReplyRequest = {
      reviewId: props.reviewInfo.id,
      content: formData.content,
      isMerchant: formData.isMerchant
    }

    // 如果是回复某个回复
    if (props.parentReply) {
      replyData.parentId = props.parentReply.id
      replyData.replyToUserId = props.parentReply.userId
    }

    await reviewApi.createReply(replyData)
    
    ElMessage.success('回复发布成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error.message || '回复失败')
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  // 重置表单
  formData.content = ''
  formData.isMerchant = false
  formRef.value?.resetFields()
}

// 导出组件名称
defineOptions({
  name: 'ReplyDialog'
})
</script>

<style scoped>
.original-review {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.review-user {
  flex: 1;
}

.username {
  font-weight: 500;
  color: #333;
  margin-right: 8px;
}

.review-content {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.parent-reply {
  background: #fff7e6;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #ffd591;
  margin-bottom: 16px;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.reply-username {
  font-weight: 500;
  color: #333;
}

.reply-content {
  margin: 0;
  color: #666;
  line-height: 1.5;
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
}
</style>
