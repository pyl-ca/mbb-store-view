// 退款相关类型定义

export interface RefundRecord {
  id: number
  refundSn: string
  orderSn: string
  userId: number
  refundAmount: number
  refundType: string // BALANCE-余额退款 ORIGINAL-原路退回
  refundTypeName: string
  status: number // 0-待业务审核 1-待财务审核 2-处理中 3-成功 4-失败 5-业务拒绝 6-财务拒绝
  statusName: string
  currentAuditStep?: string // 当前审核步骤：BUSINESS-业务审核 FINANCE-财务审核
  reason: string // 退款原因
  description?: string // 退款说明
  images?: string[] // 退款凭证图片
  contactPhone?: string // 联系电话
  // 业务审核相关
  businessAuditBy?: string // 业务审核人
  businessAuditTime?: string // 业务审核时间
  businessAuditRemark?: string // 业务审核备注
  // 财务审核相关
  financeAuditBy?: string // 财务审核人
  financeAuditTime?: string // 财务审核时间
  financeAuditRemark?: string // 财务审核备注
  // 执行相关
  executeBy?: string // 退款执行人
  executeTime?: string // 退款执行时间
  platformTransactionId?: number
  remark?: string // 退款备注
  createTime: string
  updateTime: string
  // 扩展字段（用于前端显示）
  userName?: string
  userPhone?: string
  applyTime?: string
  processTime?: string
  refundTime?: string
  processRemark?: string
  // 订单信息
  orderInfo?: {
    orderSn: string
    totalAmount: number
    payAmount: number
    payType: string
    payTypeName: string
    orderItems: RefundOrderItem[]
  }
}

export interface RefundOrderItem {
  id: number
  productId: number
  productName: string
  productImage: string
  price: number
  quantity: number
  subtotal: number
  specs: string
}

export interface RefundFlow {
  id: number
  refundSn: string
  flowType: string // REFUND_APPLY-申请退款 REFUND_APPROVE-同意退款 REFUND_PROCESS-处理退款 REFUND_SUCCESS-退款成功 REFUND_FAIL-退款失败
  flowTypeName: string
  amount: number
  beforeBalance: number // 操作前余额
  afterBalance: number // 操作后余额
  remark: string
  operatorId?: number
  operatorName?: string
  createTime: string
}

export interface RefundFilter {
  status?: number
  refundType?: number
  orderSn?: string
  refundSn?: string
  userName?: string
  startTime?: string
  endTime?: string
  page: number
  pageSize: number
}

export interface RefundListResponse {
  items?: RefundRecord[]
  records?: RefundRecord[]
  total: number
  page?: number
  pageSize?: number
}

export interface CreateRefundRequest {
  orderSn: string
  refundAmount: number
  refundType: string // BALANCE-余额退款 ORIGINAL-原路退回
  reason: string // 退款原因（必填）
  description?: string // 退款说明
  images?: string[] // 退款凭证图片
  contactPhone?: string // 联系电话
}

export interface ProcessRefundRequest {
  refundSn: string
  action: 'approve' | 'reject' | 'process'
  processRemark?: string
  refundMethod?: string // 退款方式
}

export interface AuditRefundRequest {
  refundId?: number // 单个退款记录ID
  refundIds?: number[] // 退款记录ID列表（批量审核）
  refundSn?: string // 单个退款单号
  refundSnList?: string[] // 退款单号列表（批量审核）
  auditResult: 'APPROVED' | 'REJECTED' // 审核结果：APPROVED-通过 REJECTED-拒绝
  auditRemark?: string // 审核备注
  auditBy: string // 审核人
}

// 业务审核请求
export interface BusinessAuditRequest {
  refundSns: string[]  // 注意：后端使用 refundSns 字段
  auditResult: 'APPROVED' | 'REJECTED'
  auditRemark?: string
  auditBy: string
}

// 财务审核请求
export interface FinanceAuditRequest {
  refundSns: string[]  // 注意：后端使用 refundSns 字段
  auditResult: 'APPROVED' | 'REJECTED'
  auditRemark?: string
  auditBy: string
}

// 审核流程记录
export interface RefundAuditFlow {
  id: number
  refundSn: string
  auditType: string // BUSINESS-业务审核 FINANCE-财务审核
  auditStatus: number // 0-待审核 1-通过 2-拒绝
  auditBy?: string
  auditTime?: string
  auditRemark?: string
  sortOrder: number // 审核顺序：1-业务审核 2-财务审核
  createTime: string
  updateTime: string
}

// 批量审核退款请求（保留兼容性）
export interface BatchAuditRefundRequest {
  refundIds: number[] // 退款记录ID列表
  auditResult: 'APPROVED' | 'REJECTED' // 审核结果：APPROVED-通过 REJECTED-拒绝
  auditRemark?: string // 审核备注
  auditBy: string // 审核人
}

export interface RefundStats {
  totalCount: number
  totalAmount: number
  pendingBusinessAuditCount: number // 待业务审核数量
  pendingBusinessAuditAmount: number // 待业务审核金额
  pendingFinanceAuditCount: number // 待财务审核数量
  pendingFinanceAuditAmount: number // 待财务审核金额
  processingCount: number // 处理中数量
  processingAmount: number // 处理中金额
  successCount: number // 成功数量
  successAmount: number // 成功金额
  failedCount: number // 失败数量
  failedAmount: number // 失败金额
  businessRejectedCount: number // 业务拒绝数量
  businessRejectedAmount: number // 业务拒绝金额
  financeRejectedCount: number // 财务拒绝数量
  financeRejectedAmount: number // 财务拒绝金额
}

// 平台账户信息
export interface PlatformAccount {
  id: number
  accountType: string // MAIN-主账户
  accountTypeName: string
  balance: number
  frozenAmount: number
  availableBalance: number
  totalIncome: number
  totalExpense: number
  createTime: string
  updateTime: string
}

// 资金流水记录
export interface FundFlow {
  id: number
  transactionSn: string
  accountId: number
  transactionType: string // INCOME-收入 EXPENSE-支出
  transactionTypeName: string
  businessType: string // PAYMENT-支付收入 REFUND-退款支出
  businessTypeName: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  relatedOrderSn?: string
  relatedRefundSn?: string
  description?: string
  createTime: string
}

// 用户余额变动记录
export interface UserBalanceFlow {
  id: number
  userId: number
  flowType: string // RECHARGE-充值 PAYMENT-支付 REFUND-退款
  flowTypeName: string
  amount: number
  beforeBalance: number
  afterBalance: number
  relatedOrderSn?: string
  relatedRefundSn?: string
  remark: string
  createTime: string
}

// API响应格式
export interface RefundApiResponse<T = any> {
  code: string
  message: string
  data: T
}

// 退款申请表单数据
export interface RefundFormData {
  refundType: number
  refundReason: string
  refundDescription: string
  refundAmount: number
  refundImages: string[]
}

// 退款图片上传响应
export interface RefundImageUploadResponse {
  code: number
  message: string
  data: {
    url: string
    originalName: string
  }
}
