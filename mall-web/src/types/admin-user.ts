// 管理员用户管理相关类型定义

// 用户信息
export interface AdminUser {
  id: number
  username: string
  nickname?: string
  mobile?: string
  email?: string
  gender?: number // 1-男 2-女
  status: number // 1-正常 0-禁用
  avatar?: string
  createTime: string
  updateTime: string
  createBy?: string
  updateBy?: string
  roleIds: number[]
  roleNames?: string
  roles?: string[]
}

// 用户查询过滤条件
export interface UserFilter {
  current?: number
  size?: number
  username?: string
  nickname?: string
  mobile?: string
  email?: string
  status?: number
  gender?: number
  roleId?: number
}

// 用户列表响应
export interface UserListResponse {
  records: AdminUser[]
  total: number
  size: number
  current: number
  pages: number
}

// 创建用户请求
export interface CreateUserRequest {
  username: string
  nickname?: string
  password: string
  mobile?: string
  email?: string
  gender?: number
  status?: number
  avatar?: string
  roleIds?: number[]
}

// 更新用户请求
export interface UpdateUserRequest {
  id: number
  nickname?: string
  mobile?: string
  email?: string
  gender?: number
  status?: number
  avatar?: string
  roleIds?: number[]
}

// 重置密码请求
export interface ResetPasswordRequest {
  userId: number
  newPassword: string
}

// 分配角色请求
export interface AssignRolesRequest {
  userId: number
  roleIds: number[]
}

// 角色信息
export interface Role {
  id: number
  name: string
  code: string
  sort?: number
  status: number // 0-正常 1-停用
  createTime: string
  updateTime: string
  createBy?: string
  updateBy?: string
  menuIds?: number[]
  permissionIds?: number[]
  userCount?: number
}

// 菜单信息
export interface Menu {
  id: number
  name: string
  parentId?: number
  path?: string
  component?: string
  icon?: string
  sort?: number
  visible: number // 1-开启 0-禁用
  redirect?: string
  createTime: string
  updateTime: string
  children?: Menu[]
}

// API响应基础结构
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
  timestamp: string
}

// 性别选项
export const GENDER_OPTIONS = [
  { label: '男', value: 1 },
  { label: '女', value: 2 }
]

// 用户状态选项
export const USER_STATUS_OPTIONS = [
  { label: '正常', value: 1 },
  { label: '禁用', value: 0 }
]

// 角色状态选项
export const ROLE_STATUS_OPTIONS = [
  { label: '正常', value: 0 },
  { label: '停用', value: 1 }
]
