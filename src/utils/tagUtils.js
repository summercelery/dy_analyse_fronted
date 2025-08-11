/**
 * 标签工具函数
 * 统一处理音乐标签的解析、格式化和验证
 */

/**
 * 解析标签字符串为数组
 * 支持JSON数组字符串格式 ["标签1","标签2"] 和旧的逗号分隔格式
 * @param {string} tagListString - 标签字符串
 * @returns {string[]} 标签数组
 */
export const parseTags = (tagListString) => {
  if (!tagListString) return []
  
  try {
    // 尝试解析JSON数组字符串
    const parsed = JSON.parse(tagListString)
    if (Array.isArray(parsed)) {
      return parsed.filter(tag => tag && tag.trim())
    }
    return []
  } catch (e) {
    // 如果JSON解析失败，尝试兼容旧的逗号分隔格式
    try {
      return tagListString.split(',').filter(tag => tag && tag.trim())
    } catch (fallbackError) {
      console.error('解析标签失败:', fallbackError)
      return []
    }
  }
}

/**
 * 将标签数组转换为JSON字符串格式
 * @param {string[]} tags - 标签数组
 * @returns {string} JSON字符串格式的标签
 */
export const stringifyTags = (tags) => {
  if (!Array.isArray(tags)) return '[]'
  return JSON.stringify(tags.filter(tag => tag && tag.trim()))
}

/**
 * 验证标签是否有效
 * @param {string} tag - 标签内容
 * @returns {boolean} 是否有效
 */
export const isValidTag = (tag) => {
  if (!tag || typeof tag !== 'string') return false
  const trimmed = tag.trim()
  return trimmed.length > 0 && trimmed.length <= 20
}

/**
 * 验证标签数组
 * @param {string[]} tags - 标签数组
 * @returns {object} 验证结果 {valid: boolean, message: string}
 */
export const validateTags = (tags) => {
  if (!Array.isArray(tags)) {
    return { valid: false, message: '标签必须是数组格式' }
  }
  
  // 允许标签为空数组
  if (tags.length === 0) {
    return { valid: true, message: '' }
  }
  
  if (tags.length > 10) {
    return { valid: false, message: '标签数量不能超过10个' }
  }
  
  for (let i = 0; i < tags.length; i++) {
    if (!isValidTag(tags[i])) {
      return { valid: false, message: `第${i + 1}个标签无效，长度应在1-20个字符之间` }
    }
  }
  
  return { valid: true, message: '' }
}

/**
 * 检查标签是否重复（不区分大小写）
 * @param {string[]} tags - 标签数组
 * @param {string} newTag - 新标签
 * @returns {boolean} 是否重复
 */
export const isTagDuplicate = (tags, newTag) => {
  if (!Array.isArray(tags) || !newTag) return false
  return tags.some(tag => tag.toLowerCase() === newTag.toLowerCase())
}

/**
 * 格式化标签显示
 * @param {string} tagListString - 标签字符串
 * @param {string} separator - 分隔符，默认为空字符串
 * @returns {string} 格式化后的标签字符串
 */
export const formatTagsForDisplay = (tagListString, separator = '') => {
  const tags = parseTags(tagListString)
  return tags.join(separator)
}

/**
 * 获取标签统计信息
 * @param {string} tagListString - 标签字符串
 * @returns {object} 统计信息 {count: number, tags: string[]}
 */
export const getTagStats = (tagListString) => {
  const tags = parseTags(tagListString)
  return {
    count: tags.length,
    tags: tags
  }
}
