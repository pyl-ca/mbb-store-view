/**
 * 图片处理工具函数
 */

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
    baseUrl = 'http://localhost:9999'
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
  if (imagePath.includes('/uploads/refund/')) {
    // 退款图片路径，使用 payment-service 前缀
    finalUrl = `/payment-service${finalUrl}`
  } else if (imagePath.includes('/images/product/')) {
    // 商品图片路径，使用 static 前缀
    finalUrl = `/static${finalUrl}`
  } else if (imagePath.includes('payment-service')) {
    // 已经包含 payment-service 前缀的路径，保持不变
    // 这种情况保留原有逻辑以兼容其他可能的用法
  }
  // 其他路径（如头像 /uploads/xxx）直接使用网关地址

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
  return getImageUrl(refundImagePath, {
    placeholder: '/images/placeholder/refund.png'
  })
}

/**
 * 获取商品图片URL
 * @param productImagePath 商品图片路径，格式如：/images/product/10001.jpg
 * @returns 完整的商品图片URL
 */
export function getProductImageUrl(productImagePath: string): string {
  return getImageUrl(productImagePath, {
    placeholder: '/images/placeholder/product.png'
  })
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
