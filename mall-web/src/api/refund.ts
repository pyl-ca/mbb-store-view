import axios from 'axios'
import type {
  RefundRecord,
  RefundFilter,
  RefundListResponse,
  CreateRefundRequest,
  ProcessRefundRequest,
  AuditRefundRequest,
  BusinessAuditRequest,
  FinanceAuditRequest,
  RefundAuditFlow,
  RefundStats,
  PlatformAccount,
  FundFlow,
  UserBalanceFlow
} from '../types/refund'

// 批量审核退款请求类型
interface BatchAuditRefundRequest {
  refundIds: number[]
  auditResult: 'APPROVED' | 'REJECTED'
  auditRemark?: string
  auditBy: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999'

// 获取认证头
function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  console.log('当前token:', token ? `${token.substring(0, 20)}...` : 'null')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 获取状态名称
function getStatusName(status: number): string {
  switch (status) {
    case 0: return '待业务审核'
    case 1: return '待财务审核'
    case 2: return '处理中'
    case 3: return '成功'
    case 4: return '失败'
    case 5: return '业务拒绝'
    case 6: return '财务拒绝'
    default: return '未知状态'
  }
}

// 获取退款类型名称
function getRefundTypeName(refundType: string): string {
  switch (refundType) {
    case 'BALANCE': return '余额退款'
    case 'ORIGINAL': return '原路退回'
    default: return refundType || '未知类型'
  }
}

// 处理退款项目数据，统一字段名
function processRefundItem(item: any): any {
  return {
    ...item,
    // 确保时间字段存在，处理可能的字段名差异
    createTime: item.createTime || item.create_time || item.createdAt,
    updateTime: item.updateTime || item.update_time || item.updatedAt,
    applyTime: item.applyTime || item.apply_time || item.createTime || item.create_time,
    processTime: item.processTime || item.process_time || item.auditTime || item.audit_time,
    refundTime: item.refundTime || item.refund_time || item.completeTime || item.complete_time,
    auditTime: item.auditTime || item.audit_time,
    // 确保状态和类型名称存在
    statusName: item.statusName || getStatusName(item.status),
    refundTypeName: item.refundTypeName || getRefundTypeName(item.refundType)
  }
}



// 退款API服务
export const refundApi = {
  // 获取退款列表（管理员）
  async getRefundList(filter: RefundFilter): Promise<RefundListResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-service/api/v1/refund/admin/records`, {
        params: {
          status: filter.status,
          page: filter.page,
          size: filter.pageSize
        },
        headers: getAuthHeaders()
      })
      const data = response.data.data
      return {
        items: data.records || data,
        total: data.total || (data.records ? data.records.length : data.length),
        page: filter.page,
        pageSize: filter.pageSize
      }
    } catch (error: any) {
      console.error('获取退款列表失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取退款列表失败')
    }
  },

  // 获取用户退款记录
  async getUserRefundList(params: { status?: number; page?: number; pageSize?: number } = {}): Promise<RefundListResponse> {
    try {
      console.log('API调用参数:', params)
      const response = await axios.get(`${API_BASE_URL}/payment-service/api/v1/refund/user/records`, {
        params,
        headers: getAuthHeaders()
      })
      console.log('API响应:', response.data)

      // 检查响应格式
      if (response.data.code === '000000') {
        const data = response.data.data
        console.log('响应数据:', data)

        let items = []
        let total = 0

        // 处理不同的响应格式
        if (Array.isArray(data)) {
          // 如果data直接是数组
          items = data.map(processRefundItem)
          total = data.length
        } else if (data && typeof data === 'object') {
          // 如果data是对象，可能包含records和total
          const rawItems = data.records || data.content || data.list || []
          items = rawItems.map(processRefundItem)
          total = data.total || data.totalElements || items.length
        }

        const result = {
          items,
          total,
          page: params.page || 1,
          pageSize: params.pageSize || 10
        }
        console.log('处理后的结果:', result)
        return result
      } else {
        throw new Error(response.data.msg || '获取退款记录失败')
      }
    } catch (error: any) {
      console.error('获取用户退款记录失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取用户退款记录失败')
    }
  },

  // 获取退款详情
  async getRefundDetail(refundSn: string): Promise<RefundRecord> {
    try {
      console.log('调用退款详情API:', `${API_BASE_URL}/payment-service/api/v1/refund/${refundSn}`)
      const response = await axios.get(`${API_BASE_URL}/payment-service/api/v1/refund/${refundSn}`, {
        headers: getAuthHeaders()
      })
      console.log('退款详情API响应:', response.data)

      if (response.data.code === '000000') {
        const data = response.data.data
        console.log('原始API数据:', data)

        // 处理数据，确保字段完整
        const processedData: RefundRecord = {
          ...data,
          // 时间字段处理
          applyTime: data.createTime, // 申请时间使用创建时间
          processTime: data.updateTime, // 处理时间使用更新时间
          auditTime: data.updateTime, // 审核时间使用更新时间
          refundTime: data.status === 2 ? data.updateTime : undefined, // 只有成功状态才有退款完成时间

          // 确保状态和类型名称存在
          statusName: data.statusName || getStatusName(data.status),
          refundTypeName: data.refundTypeName || getRefundTypeName(data.refundType),

          // 确保图片字段存在
          images: data.images || [],

          // 模拟订单信息（如果API没有返回的话）
          orderInfo: data.orderInfo || {
            orderSn: data.orderSn,
            totalAmount: data.refundAmount,
            payAmount: data.refundAmount,
            payType: data.refundType === 'BALANCE' ? 'BALANCE' : 'WECHAT',
            payTypeName: data.refundType === 'BALANCE' ? '余额支付' : '微信支付',
            orderItems: [
              {
                id: 1,
                productId: 1,
                productName: 'iPhone 15 Pro Max',
                productImage: '/images/product/10001.jpg',
                price: data.refundAmount,
                quantity: 1,
                subtotal: data.refundAmount,
                specs: '深空黑色 256GB'
              }
            ]
          }
        }

        console.log('处理后的数据:', processedData)
        return processedData
      } else {
        throw new Error(response.data.msg || '获取退款详情失败')
      }
    } catch (error: any) {
      console.error('获取退款详情失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取退款详情失败')
    }
  },

  // 根据订单号获取退款信息
  async getRefundByOrderSn(orderSn: string): Promise<RefundRecord | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-service/api/v1/refund/order/${orderSn}`, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取订单退款信息失败:', error)
      return null
    }
  },

  // 处理退款（新API）
  async processRefund(refundData: CreateRefundRequest): Promise<RefundRecord> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment-service/api/v1/refund/process`,
        refundData,
        { headers: getAuthHeaders() }
      )
      return response.data.data
    } catch (error: any) {
      console.error('处理退款失败:', error)
      throw new Error(error.response?.data?.message || error.message || '处理退款失败')
    }
  },

  // 创建退款申请（保留兼容性）
  async createRefund(refundData: CreateRefundRequest): Promise<boolean> {
    try {
      await this.processRefund(refundData)
      return true
    } catch (error: any) {
      console.error('创建退款申请失败:', error)
      return false
    }
  },

  // 审核退款申请
  async auditRefund(auditData: AuditRefundRequest): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment-service/api/v1/refund/audit`,
        auditData,
        { headers: getAuthHeaders() }
      )
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('审核退款申请失败:', error)
      throw new Error(error.response?.data?.message || error.message || '审核退款申请失败')
    }
  },

  // 批量审核退款申请
  async batchAuditRefund(batchData: BatchAuditRefundRequest): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment-service/api/v1/refund/audit`,
        batchData,
        { headers: getAuthHeaders() }
      )
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('批量审核退款申请失败:', error)
      throw new Error(error.response?.data?.message || error.message || '批量审核退款申请失败')
    }
  },

  // 处理退款申请（管理员）- 保留兼容性
  async processRefundAdmin(processData: ProcessRefundRequest): Promise<boolean> {
    try {
      const { refundSn, action, ...data } = processData
      const response = await axios.post(
        `${API_BASE_URL}/payment-service/api/v1/refund/${refundSn}/${action}`,
        data,
        { headers: getAuthHeaders() }
      )
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('处理退款申请失败:', error)
      throw new Error(error.response?.data?.message || error.message || '处理退款申请失败')
    }
  },

  // 执行退款（系统）
  async executeRefund(refundSn: string, refundMethod: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment-service/api/v1/refund/${refundSn}/execute`,
        { refundMethod },
        { headers: getAuthHeaders() }
      )
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('执行退款失败:', error)
      throw new Error(error.response?.data?.message || error.message || '执行退款失败')
    }
  },

  // 获取退款统计
  async getRefundStats(): Promise<RefundStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-service/api/v1/refund/stats`, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取退款统计失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取退款统计失败')
    }
  },

  // 获取平台主账户信息
  async getPlatformAccount(): Promise<PlatformAccount> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-service/api/v1/platform/account/main`, {
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取平台账户信息失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取平台账户信息失败')
    }
  },

  // 获取平台流水记录
  async getFundFlows(params: any): Promise<{ items: FundFlow[], total: number }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-service/api/v1/platform/account/transactions`, {
        params,
        headers: getAuthHeaders()
      })
      const data = response.data.data
      return {
        items: data.records || data,
        total: data.total || (data.records ? data.records.length : data.length)
      }
    } catch (error: any) {
      console.error('获取平台流水记录失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取平台流水记录失败')
    }
  },

  // 获取用户余额流水
  async getUserBalanceFlows(params: any): Promise<{ items: UserBalanceFlow[], total: number }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-service/api/v1/users/balance-flows`, {
        params,
        headers: getAuthHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('获取用户余额流水失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取用户余额流水失败')
    }
  },

  // 上传退款图片
  async uploadRefundImage(file: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(
        `${API_BASE_URL}/payment-service/api/v1/refund/upload-image`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.code === '000000') {
        return response.data.data.url
      } else {
        throw new Error(response.data.message || '上传失败')
      }
    } catch (error: any) {
      console.error('上传图片失败:', error)
      throw new Error(error.response?.data?.message || error.message || '上传图片失败')
    }
  },

  // 业务审核（第一步）
  async businessAudit(auditData: BusinessAuditRequest): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment-service/api/v1/refund/business-audit`,
        auditData,
        { headers: getAuthHeaders() }
      )
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('业务审核失败:', error)
      throw new Error(error.response?.data?.message || error.message || '业务审核失败')
    }
  },

  // 财务审核（第二步）
  async financeAudit(auditData: FinanceAuditRequest): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment-service/api/v1/refund/finance-audit`,
        auditData,
        { headers: getAuthHeaders() }
      )
      return response.data.code === '000000'
    } catch (error: any) {
      console.error('财务审核失败:', error)
      throw new Error(error.response?.data?.message || error.message || '财务审核失败')
    }
  },

  // 查询审核流程
  async getAuditFlow(refundSn: string): Promise<RefundAuditFlow[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payment-service/api/v1/refund/${refundSn}/audit-flow`,
        { headers: getAuthHeaders() }
      )
      return response.data.data || []
    } catch (error: any) {
      console.error('获取审核流程失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取审核流程失败')
    }
  },

  // 获取当前待审核步骤
  async getCurrentAuditStep(refundSn: string): Promise<RefundAuditFlow | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payment-service/api/v1/refund/${refundSn}/current-audit-step`,
        { headers: getAuthHeaders() }
      )
      return response.data.data || null
    } catch (error: any) {
      console.error('获取当前审核步骤失败:', error)
      throw new Error(error.response?.data?.message || error.message || '获取当前审核步骤失败')
    }
  }
}
