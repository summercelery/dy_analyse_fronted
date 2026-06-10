const COLOR_FAMILIES = [
  {
    key: 'red',
    label: '红色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#d69e9e' },
      { label: '浅', hex: '#cf8c8c' },
      { label: '中浅', hex: '#c77b7b' },
      { label: '中', hex: '#bc6a6a' },
      { label: '深', hex: '#a85858' },
      { label: '极深', hex: '#8f4747' },
    ],
  },
  {
    key: 'coral',
    label: '橙色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#d6ac9a' },
      { label: '浅', hex: '#cf9c87' },
      { label: '中浅', hex: '#c78d75' },
      { label: '中', hex: '#bc7d64' },
      { label: '深', hex: '#a86b53' },
      { label: '极深', hex: '#8f5943' },
    ],
  },
  {
    key: 'brown',
    label: '棕色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#c4b0a0' },
      { label: '浅', hex: '#bca08e' },
      { label: '中浅', hex: '#b2907c' },
      { label: '中', hex: '#a6806b' },
      { label: '深', hex: '#926e5a' },
      { label: '极深', hex: '#7a5c4b' },
    ],
  },
  {
    key: 'amber',
    label: '黄色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#ccbb8c' },
      { label: '浅', hex: '#c5b07a' },
      { label: '中浅', hex: '#bea568' },
      { label: '中', hex: '#b49a57' },
      { label: '深', hex: '#9e8547' },
      { label: '极深', hex: '#84703b' },
    ],
  },
  {
    key: 'green',
    label: '绿色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#9cc49b' },
      { label: '浅', hex: '#8bb889' },
      { label: '中浅', hex: '#7bac78' },
      { label: '中', hex: '#6b9e68' },
      { label: '深', hex: '#5a8a57' },
      { label: '极深', hex: '#4b7348' },
    ],
  },
  {
    key: 'teal',
    label: '青色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#8fbfb7' },
      { label: '浅', hex: '#7db3aa' },
      { label: '中浅', hex: '#6ca69c' },
      { label: '中', hex: '#5c988d' },
      { label: '深', hex: '#4c847a' },
      { label: '极深', hex: '#3f6f67' },
    ],
  },
  {
    key: 'blue',
    label: '蓝色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#a3c0db' },
      { label: '浅', hex: '#8cafcf' },
      { label: '中浅', hex: '#7aa1c5' },
      { label: '中', hex: '#6993ba' },
      { label: '深', hex: '#5780a8' },
      { label: '极深', hex: '#476b8f' },
    ],
  },
  {
    key: 'indigo',
    label: '靛蓝系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#a6a0c9' },
      { label: '浅', hex: '#958ebd' },
      { label: '中浅', hex: '#857db2' },
      { label: '中', hex: '#756ca6' },
      { label: '深', hex: '#625a91' },
      { label: '极深', hex: '#524b7a' },
    ],
  },
  {
    key: 'purple',
    label: '紫色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#baabd4' },
      { label: '浅', hex: '#ab99c8' },
      { label: '中浅', hex: '#9c88bc' },
      { label: '中', hex: '#8d77b0' },
      { label: '深', hex: '#7a64a0' },
      { label: '极深', hex: '#67538a' },
    ],
  },
  {
    key: 'pink',
    label: '粉色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#dba8b2' },
      { label: '浅', hex: '#d494a1' },
      { label: '中浅', hex: '#cd8391' },
      { label: '中', hex: '#c47281' },
      { label: '深', hex: '#ae5f6e' },
      { label: '极深', hex: '#924e5c' },
    ],
  },
  {
    key: 'gray',
    label: '灰色系',
    defaultShadeIndex: 3,
    shades: [
      { label: '极浅', hex: '#b8bcc1' },
      { label: '浅', hex: '#a6abb1' },
      { label: '中浅', hex: '#979ca3' },
      { label: '中', hex: '#888d95' },
      { label: '深', hex: '#747981' },
      { label: '极深', hex: '#61666d' },
    ],
  },
]

const FAMILY_KEYWORDS = {
  red: ['热血', '燃', '说唱', 'rapper', '潮流', '嘻哈', '街舞'],
  coral: ['搞怪', '搞笑', '舞蹈', '演绎', '表演', '才艺'],
  brown: ['复古', '怀旧', '手工', '文艺', '古风', '国风'],
  amber: ['原声', 'live', '现场', '音乐', '演唱', '唱歌'],
  green: ['风景', '自然', '旅行', '美食', '生活', '图文', '户外'],
  teal: ['科技', '游戏', '数码', '知识', '编程', '科普', '测评'],
  blue: ['翻唱', '吉他', '键盘', '音乐人', '弹唱', '乐器', '钢琴'],
  indigo: ['深度', '思考', '读书', '教育', '人文', '历史', '哲学'],
  purple: ['影视', '混剪', '创意', '特效', '动漫', '二次元'],
  pink: ['甜妹', '颜值', '可爱', '女生', '美女', '女神', '萌', '少女'],
  gray: ['解说', 'reaction', '记录', '日常', 'vlog', '歌词', '素材', '拼贴'],
}

const DEFAULT_CHANNEL_COLOR = '#888d95'

function getFamilyByKeyword(name) {
  if (!name) return 'gray'
  const lower = name.toLowerCase()
  for (const [familyKey, keywords] of Object.entries(FAMILY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return familyKey
    }
  }
  return 'gray'
}

function getDefaultShade(familyKey) {
  const family = COLOR_FAMILIES.find(f => f.key === familyKey)
  if (family) {
    return family.shades[family.defaultShadeIndex].hex
  }
  return DEFAULT_CHANNEL_COLOR
}

function getFamilyByKey(key) {
  return COLOR_FAMILIES.find(f => f.key === key)
}

function hexToRgb(hex) {
  if (!hex) return null
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  if (h.length !== 6) return null
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function getHue(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return Infinity
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (delta === 0) return Infinity
  const saturation = delta / max
  if (saturation < 0.12) return Infinity
  let hue = 0
  if (max === r) {
    hue = ((g - b) / delta) % 6
  } else if (max === g) {
    hue = (b - r) / delta + 2
  } else {
    hue = (r - g) / delta + 4
  }
  hue = Math.round(hue * 60)
  if (hue < 0) hue += 360
  return hue
}

function lightPillStyle(hexColor) {
  const rgb = hexToRgb(hexColor)
  if (!rgb) {
    return {
      backgroundColor: 'rgba(136, 141, 149, 0.12)',
      color: '#888d95',
      borderColor: 'rgba(136, 141, 149, 0.30)',
    }
  }
  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
    color: hexColor,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.30)`,
  }
}

function applyLightPillStyle(hexColor) {
  return {
    ...lightPillStyle(hexColor),
    fontSize: '11px',
    borderRadius: '3px',
    padding: '1px 6px',
    display: 'inline-block',
    fontWeight: '500',
    lineHeight: '1.6',
  }
}

function filterChipStyle(hexColor, selected) {
  const safeHex = hexColor || DEFAULT_CHANNEL_COLOR
  const rgb = hexToRgb(safeHex)
  if (!rgb) {
    return selected
      ? { backgroundColor: '#409eff', color: '#fff', borderColor: '#409eff' }
      : { backgroundColor: 'rgba(144,147,153,0.10)', color: '#909399', borderColor: 'rgba(144,147,153,0.22)' }
  }
  if (selected) {
    return {
      backgroundColor: safeHex,
      color: '#fff',
      borderColor: safeHex,
    }
  }
  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.10)`,
    color: safeHex,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`,
  }
}

function highlightedPillStyle(hexColor) {
  const safeHex = hexColor || DEFAULT_CHANNEL_COLOR
  const rgb = hexToRgb(safeHex)
  if (!rgb) {
    return {
      backgroundColor: 'rgba(136,141,149,0.30)',
      color: '#61666d',
      borderColor: 'rgba(136,141,149,0.55)',
    }
  }
  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.30)`,
    color: safeHex,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`,
  }
}

export {
  COLOR_FAMILIES,
  FAMILY_KEYWORDS,
  DEFAULT_CHANNEL_COLOR,
  getFamilyByKeyword,
  getDefaultShade,
  getFamilyByKey,
  getHue,
  lightPillStyle,
  applyLightPillStyle,
  filterChipStyle,
  highlightedPillStyle,
}
