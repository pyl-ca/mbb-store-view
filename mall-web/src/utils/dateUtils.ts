/**
 * 日期时间工具函数
 */

/**
 * 格式化时间为中文本地化格式
 * @param time 时间字符串或时间戳
 * @param options 格式化选项
 * @returns 格式化后的时间字符串
 */
export function formatTime(
  time: string | number | Date, 
  options: {
    includeSeconds?: boolean
    dateOnly?: boolean
    timeOnly?: boolean
  } = {}
): string {
  if (!time) return '未知时间'
  
  try {
    let date: Date
    
    // 处理不同类型的时间输入
    if (typeof time === 'string') {
      // 如果是字符串，尝试解析
      date = new Date(time)
    } else if (typeof time === 'number') {
      // 如果是数字，判断是秒还是毫秒
      date = new Date(time < 10000000000 ? time * 1000 : time)
    } else {
      date = time
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的时间格式:', time)
      return '时间格式错误'
    }
    
    const { includeSeconds = false, dateOnly = false, timeOnly = false } = options
    
    if (dateOnly) {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }
    
    if (timeOnly) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        ...(includeSeconds && { second: '2-digit' })
      })
    }
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds && { second: '2-digit' })
    })
  } catch (error) {
    console.error('时间格式化错误:', error, time)
    return '时间格式错误'
  }
}

/**
 * 格式化为相对时间（如：刚刚、5分钟前、1小时前等）
 * @param time 时间字符串或时间戳
 * @returns 相对时间字符串
 */
export function formatRelativeTime(time: string | number | Date): string {
  if (!time) return '未知时间'
  
  try {
    let date: Date
    
    if (typeof time === 'string') {
      date = new Date(time)
    } else if (typeof time === 'number') {
      date = new Date(time < 10000000000 ? time * 1000 : time)
    } else {
      date = time
    }
    
    if (isNaN(date.getTime())) {
      return '时间格式错误'
    }
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)
    
    if (seconds < 60) {
      return '刚刚'
    } else if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 30) {
      return `${days}天前`
    } else if (months < 12) {
      return `${months}个月前`
    } else {
      return `${years}年前`
    }
  } catch (error) {
    console.error('相对时间格式化错误:', error, time)
    return '时间格式错误'
  }
}

/**
 * 格式化日期范围
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 格式化的日期范围字符串
 */
export function formatDateRange(
  startTime: string | number | Date, 
  endTime: string | number | Date
): string {
  const start = formatTime(startTime, { dateOnly: true })
  const end = formatTime(endTime, { dateOnly: true })
  
  if (start === end) {
    return start
  }
  
  return `${start} 至 ${end}`
}

/**
 * 检查时间是否为今天
 * @param time 时间字符串或时间戳
 * @returns 是否为今天
 */
export function isToday(time: string | number | Date): boolean {
  try {
    let date: Date
    
    if (typeof time === 'string') {
      date = new Date(time)
    } else if (typeof time === 'number') {
      date = new Date(time < 10000000000 ? time * 1000 : time)
    } else {
      date = time
    }
    
    if (isNaN(date.getTime())) {
      return false
    }
    
    const today = new Date()
    return date.toDateString() === today.toDateString()
  } catch (error) {
    return false
  }
}

/**
 * 检查时间是否为昨天
 * @param time 时间字符串或时间戳
 * @returns 是否为昨天
 */
export function isYesterday(time: string | number | Date): boolean {
  try {
    let date: Date
    
    if (typeof time === 'string') {
      date = new Date(time)
    } else if (typeof time === 'number') {
      date = new Date(time < 10000000000 ? time * 1000 : time)
    } else {
      date = time
    }
    
    if (isNaN(date.getTime())) {
      return false
    }
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return date.toDateString() === yesterday.toDateString()
  } catch (error) {
    return false
  }
}

/**
 * 智能格式化时间（今天显示时间，昨天显示"昨天 时间"，其他显示完整日期时间）
 * @param time 时间字符串或时间戳
 * @returns 智能格式化的时间字符串
 */
export function formatSmartTime(time: string | number | Date): string {
  if (!time) return '未知时间'
  
  try {
    if (isToday(time)) {
      return '今天 ' + formatTime(time, { timeOnly: true })
    } else if (isYesterday(time)) {
      return '昨天 ' + formatTime(time, { timeOnly: true })
    } else {
      return formatTime(time)
    }
  } catch (error) {
    return formatTime(time)
  }
}
