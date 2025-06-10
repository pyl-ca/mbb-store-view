/**
 * 图片处理工具函数
 */

// 获取API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999'
console.log('🌐 当前 API_BASE_URL:', API_BASE_URL)
console.log('🌐 环境变量 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
console.log('🌐 当前环境模式:', import.meta.env.MODE)
console.log('🌐 所有环境变量:', import.meta.env)

/**
 * 获取完整的图片URL
 * @param imagePath 图片路径
 * @param options 选项
 * @returns 完整的图片URL
 */
export function getImageUrl(
  imagePath: string,
  options: {
    placeholder?: string
    baseUrl?: string
  } = {}
): string {
  const {
    placeholder = '/images/placeholder/no-image.png',
    baseUrl = API_BASE_URL
  } = options

  console.log('处理图片路径:', imagePath)

  if (!imagePath) {
    console.log('图片路径为空，使用占位图')
    return placeholder
  }

  // 如果已经是完整的URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('检测到完整URL，直接返回:', imagePath)
    return imagePath
  }

  // 处理相对路径
  let finalUrl = imagePath

  // 如果路径不以 / 开头，添加 /
  if (!imagePath.startsWith('/')) {
    finalUrl = '/' + imagePath
  }

  // 根据路径类型决定是否需要添加服务前缀
  if (imagePath.includes('/images/product/')) {
    // 商品图片路径，使用 static 前缀
    finalUrl = `/static${finalUrl}`
  } else if (imagePath.includes('payment-service')) {
    // 移除 payment-service 前缀，让网关路由处理
    finalUrl = finalUrl.replace(/\/payment-service\//g, '/')
    console.log('🔧 getImageUrl 移除 payment-service 前缀后:', finalUrl)
  }
  // 其他路径（如头像 /uploads/xxx、退款图片 /uploads/refund/xxx、评论图片 /uploads/review/xxx）
  // 都直接使用网关地址，由网关路由到对应的服务

  const result = `${baseUrl}${finalUrl}`
  console.log('最终图片URL:', result)
  return result
}

/**
 * 获取用户头像URL
 * @param avatarPath 头像路径，格式如：/uploads/1748054898986-OIP.jpg
 * @returns 完整的头像URL
 */
export function getAvatarUrl(avatarPath: string): string {
  return getImageUrl(avatarPath, {
    placeholder: '/images/placeholder/avatar.png'
  })
}

/**
 * 获取退款图片URL
 * @param refundImagePath 退款图片路径
 * @returns 完整的退款图片URL
 */
export function getRefundImageUrl(refundImagePath: string): string {
  if (!refundImagePath) return '/images/placeholder/refund.png'

  console.log('🔍 处理退款图片路径:', refundImagePath)

  // 如果是完整的URL，检查是否需要替换localhost
  if (refundImagePath.startsWith('http')) {
    if (refundImagePath.includes('localhost:9999')) {
      const correctedUrl = refundImagePath.replace('http://localhost:9999', 'http://39.107.74.208:9999')
      console.log('🔧 替换localhost为服务器地址:', correctedUrl)
      return correctedUrl
    }
    console.log('✅ 已经是正确的完整URL，直接返回:', refundImagePath)
    return refundImagePath
  }

  // 处理退款图片路径
  let finalPath = refundImagePath

  // 如果路径不以 / 开头，添加 /
  if (!refundImagePath.startsWith('/')) {
    finalPath = '/' + refundImagePath
    console.log('📝 添加前缀斜杠后:', finalPath)
  }

  // 移除任何服务前缀（payment-service、review-service等）
  finalPath = finalPath.replace(/\/(payment-service|review-service)\//g, '/')
  console.log('✂️ 移除服务前缀后:', finalPath)

  // 处理各种路径格式，确保最终格式为 /uploads/refund/filename
  if (finalPath.includes('/refund/')) {
    // 如果包含 /refund/ 但不以 /uploads/ 开头
    if (!finalPath.startsWith('/uploads/')) {
      if (finalPath.startsWith('/refund/')) {
        // 路径以 /refund/ 开头，添加 /uploads 前缀
        finalPath = '/uploads' + finalPath
      } else {
        // 路径中间包含 /refund/，提取 /refund/ 部分
        const refundIndex = finalPath.indexOf('/refund/')
        const refundPart = finalPath.substring(refundIndex)
        finalPath = '/uploads' + refundPart
      }
      console.log('🔧 调整为 uploads/refund 路径后:', finalPath)
    }
  } else if (!finalPath.startsWith('/uploads/')) {
    // 如果不包含 /refund/ 且不以 /uploads/ 开头，假设是纯文件名
    const fileName = finalPath.replace(/^\/+/, '') // 移除开头的斜杠
    finalPath = '/uploads/refund/' + fileName
    console.log('🆕 构建完整 uploads/refund 路径:', finalPath)
  }

  // 强制使用正确的服务器地址
  const CORRECT_BASE_URL = 'http://39.107.74.208:9999'
  const result = `${CORRECT_BASE_URL}${finalPath}`
  console.log('🎯 最终退款图片URL:', result)
  console.log('🎯 使用的基础URL:', CORRECT_BASE_URL)
  console.log('🎯 环境变量API_BASE_URL:', API_BASE_URL)
  return result
}

/**
 * 获取商品图片URL
 * @param productImagePath 商品图片路径，格式如：/images/product/10001.jpg 或 /static/images/product/10001.jpg
 * @returns 完整的商品图片URL
 */
export function getProductImageUrl(productImagePath: string): string {
  if (!productImagePath) return ''
  if (productImagePath.startsWith('http')) return productImagePath

  // 强制使用正确的服务器地址
  const CORRECT_BASE_URL = 'http://39.107.74.208:9999'

  // 如果路径已经包含 /static 前缀，直接拼接基础URL
  if (productImagePath.startsWith('/static/')) {
    return `${CORRECT_BASE_URL}${productImagePath}`
  }

  // 否则添加 /static 前缀
  return `${CORRECT_BASE_URL}/static${productImagePath}`
}

/**
 * 获取用户头像URL（专用函数）
 * @param avatarPath 头像路径
 * @returns 完整的头像URL
 */
export function getUserAvatarUrl(avatarPath: string): string {
  if (!avatarPath) return ''
  if (avatarPath.startsWith('http')) return avatarPath

  // 强制使用正确的服务器地址
  const CORRECT_BASE_URL = 'http://39.107.74.208:9999'

  // 处理不同的头像路径格式
  if (avatarPath.startsWith('/uploads/')) {
    return `${CORRECT_BASE_URL}/user-service${avatarPath}`
  } else if (avatarPath.startsWith('uploads/')) {
    return `${CORRECT_BASE_URL}/user-service/${avatarPath}`
  } else {
    return `${CORRECT_BASE_URL}/user-service/uploads/${avatarPath}`
  }
}

/**
 * 获取轮播图URL
 * @param imageUrl 图片URL
 * @returns 完整的轮播图URL
 */
export function getBannerImageUrl(imageUrl: string): string {
  if (!imageUrl) return `${API_BASE_URL}/product-service/search1.png`
  if (imageUrl.startsWith('http')) return imageUrl

  if (imageUrl.startsWith('/product-service/')) {
    return `${API_BASE_URL}${imageUrl}`
  } else if (imageUrl.includes('/uploads/') || imageUrl.includes('/images/')) {
    return `${API_BASE_URL}/product-service/uploads/images${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`
  }

  return `${API_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`
}

/**
 * 获取评论图片URL
 * @param imagePath 图片路径
 * @returns 完整的评论图片URL
 */
export function getReviewImageUrl(imagePath: string): string {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath

  // 处理评论图片路径
  let finalPath = imagePath

  // 如果路径不以 / 开头，添加 /
  if (!imagePath.startsWith('/')) {
    finalPath = '/' + imagePath
  }

  // 如果路径包含 /review/ 但不包含 /uploads/，添加 /uploads 前缀
  if (finalPath.includes('/review/') && !finalPath.startsWith('/uploads/')) {
    finalPath = '/uploads' + finalPath
  }

  // 如果路径以 /review/ 开头，转换为 /uploads/review/
  if (finalPath.startsWith('/review/')) {
    finalPath = '/uploads' + finalPath
  }

  // 如果已经是完整的uploads路径
  if (finalPath.startsWith('/uploads/')) {
    return `${API_BASE_URL}${finalPath}`
  }

  return `${API_BASE_URL}${finalPath}`
}

/**
 * 获取上传URL
 * @param service 服务名称
 * @param endpoint 端点
 * @returns 完整的上传URL
 */
export function getUploadUrl(service: string, endpoint: string): string {
  return `${API_BASE_URL}/${service}${endpoint}`
}

/**
 * 批量处理图片URL
 * @param imagePaths 图片路径数组
 * @param options 选项
 * @returns 完整的图片URL数组
 */
export function getImageUrls(
  imagePaths: string[],
  options: {
    placeholder?: string
    baseUrl?: string
  } = {}
): string[] {
  if (!Array.isArray(imagePaths)) {
    return []
  }

  return imagePaths.map(path => getImageUrl(path, options))
}

/**
 * 检查图片URL是否有效
 * @param imageUrl 图片URL
 * @returns Promise<boolean>
 */
export function checkImageUrl(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(false)
      return
    }

    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = imageUrl
  })
}

/**
 * 预加载图片
 * @param imageUrls 图片URL数组
 * @returns Promise<string[]> 成功加载的图片URL数组
 */
export function preloadImages(imageUrls: string[]): Promise<string[]> {
  const promises = imageUrls.map(url =>
    checkImageUrl(url).then(isValid => isValid ? url : null)
  )

  return Promise.all(promises).then(results =>
    results.filter(url => url !== null) as string[]
  )
}

/**
 * 获取图片文件扩展名
 * @param imagePath 图片路径
 * @returns 文件扩展名（不包含点）
 */
export function getImageExtension(imagePath: string): string {
  if (!imagePath) return ''

  const lastDotIndex = imagePath.lastIndexOf('.')
  if (lastDotIndex === -1) return ''

  return imagePath.substring(lastDotIndex + 1).toLowerCase()
}

/**
 * 检查是否为支持的图片格式
 * @param imagePath 图片路径
 * @returns 是否为支持的图片格式
 */
export function isSupportedImageFormat(imagePath: string): boolean {
  const supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const extension = getImageExtension(imagePath)
  return supportedFormats.includes(extension)
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 压缩图片（客户端）
 * @param file 图片文件
 * @param options 压缩选项
 * @returns Promise<Blob>
 */
export function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<Blob> {
  const { maxWidth = 800, maxHeight = 600, quality = 0.8 } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算新的尺寸
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // 绘制图片
      ctx?.drawImage(img, 0, 0, width, height)

      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('图片压缩失败'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}
