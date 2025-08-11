<template>
  <div class="tag-test-container">
    <h1>音乐标签功能测试页面</h1>
    
    <div class="test-section">
      <h2>标签解析测试</h2>
      <el-input
        v-model="testTagString"
        placeholder="输入标签字符串进行测试"
        type="textarea"
        :rows="3"
        style="margin-bottom: 20px;"
      />
      <el-button @click="testParseTags" type="primary">测试解析</el-button>
      <div class="result-display">
        <h3>解析结果：</h3>
        <pre>{{ parseResult }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h2>标签验证测试</h2>
      <el-input
        v-model="testTag"
        placeholder="输入单个标签进行验证"
        style="margin-bottom: 20px; width: 300px;"
      />
      <el-button @click="testTagValidation" type="primary">测试验证</el-button>
      <div class="result-display">
        <h3>验证结果：</h3>
        <pre>{{ validationResult }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h2>标签数组测试</h2>
      <div class="tag-input-container">
        <el-input
          v-model="newTag"
          placeholder="输入标签后按回车添加"
          @keyup.enter="addTestTag"
          class="tag-input"
        >
          <template #append>
            <el-button @click="addTestTag" :disabled="!newTag.trim()">添加</el-button>
          </template>
        </el-input>
        
        <div class="tag-list" v-if="testTags.length > 0">
          <el-tag
            v-for="(tag, index) in testTags"
            :key="index"
            closable
            @close="removeTestTag(index)"
            class="music-tag"
          >
            {{ tag }}
          </el-tag>
        </div>
        
        <div class="tag-tips">
          <small>提示：标签用于分类和搜索，建议使用2-5个标签</small>
        </div>
      </div>
      
      <div class="test-actions" style="margin-top: 20px;">
        <el-button @click="testStringifyTags" type="success">测试序列化</el-button>
        <el-button @click="testValidateTags" type="warning">测试数组验证</el-button>
        <el-button @click="clearTestTags" type="info">清空标签</el-button>
      </div>
      
      <div class="result-display">
        <h3>测试结果：</h3>
        <pre>{{ arrayTestResult }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h2>标签重复检查测试</h2>
      <el-input
        v-model="duplicateTestTag"
        placeholder="输入标签检查是否重复"
        style="margin-bottom: 20px; width: 300px;"
      />
      <el-button @click="testDuplicateCheck" type="primary">检查重复</el-button>
      <div class="result-display">
        <h3>重复检查结果：</h3>
        <pre>{{ duplicateResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  parseTags, 
  stringifyTags, 
  validateTags, 
  isValidTag, 
  isTagDuplicate,
  formatTagsForDisplay,
  getTagStats
} from '@/utils/tagUtils'

// 测试数据
const testTagString = ref('["流行","抒情","华语"]')
const testTag = ref('测试标签')
const newTag = ref('')
const testTags = ref(['流行', '抒情'])
const duplicateTestTag = ref('流行')

// 测试结果
const parseResult = ref('')
const validationResult = ref('')
const arrayTestResult = ref('')
const duplicateResult = ref('')

// 测试标签解析
const testParseTags = () => {
  try {
    const parsed = parseTags(testTagString.value)
    parseResult.value = JSON.stringify({
      input: testTagString.value,
      parsed: parsed,
      count: parsed.length,
      type: typeof parsed,
      isArray: Array.isArray(parsed)
    }, null, 2)
  } catch (error) {
    parseResult.value = `解析失败: ${error.message}`
  }
}

// 测试标签验证
const testTagValidation = () => {
  try {
    const valid = isValidTag(testTag.value)
    validationResult.value = JSON.stringify({
      input: testTag.value,
      isValid: valid,
      length: testTag.value.length,
      trimmed: testTag.value.trim().length
    }, null, 2)
  } catch (error) {
    validationResult.value = `验证失败: ${error.message}`
  }
}

// 添加测试标签
const addTestTag = () => {
  const tag = newTag.value.trim()
  
  if (!tag) {
    ElMessage.warning('请输入标签内容')
    return
  }
  
  if (!isValidTag(tag)) {
    ElMessage.warning('标签长度应在1-20个字符之间')
    return
  }
  
  if (testTags.value.length >= 10) {
    ElMessage.warning('标签数量不能超过10个')
    return
  }
  
  if (isTagDuplicate(testTags.value, tag)) {
    ElMessage.warning('标签已存在')
    return
  }
  
  testTags.value.push(tag)
  newTag.value = ''
  ElMessage.success('标签添加成功')
}

// 移除测试标签
const removeTestTag = (index) => {
  testTags.value.splice(index, 1)
}

// 测试标签序列化
const testStringifyTags = () => {
  try {
    const stringified = stringifyTags(testTags.value)
    const stats = getTagStats(stringified)
    arrayTestResult.value = JSON.stringify({
      tags: testTags.value,
      stringified: stringified,
      stats: stats,
      parsedBack: parseTags(stringified)
    }, null, 2)
  } catch (error) {
    arrayTestResult.value = `序列化失败: ${error.message}`
  }
}

// 测试标签数组验证
const testValidateTags = () => {
  try {
    const validation = validateTags(testTags.value)
    arrayTestResult.value = JSON.stringify({
      tags: testTags.value,
      validation: validation,
      count: testTags.value.length
    }, null, 2)
  } catch (error) {
    arrayTestResult.value = `验证失败: ${error.message}`
  }
}

// 清空测试标签
const clearTestTags = () => {
  testTags.value = []
  arrayTestResult.value = ''
}

// 测试重复检查
const testDuplicateCheck = () => {
  try {
    const isDuplicate = isTagDuplicate(testTags.value, duplicateTestTag.value)
    duplicateResult.value = JSON.stringify({
      existingTags: testTags.value,
      newTag: duplicateTestTag.value,
      isDuplicate: isDuplicate,
      caseInsensitive: true
    }, null, 2)
  } catch (error) {
    duplicateResult.value = `检查失败: ${error.message}`
  }
}
</script>

<style scoped>
.tag-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.test-section h2 {
  margin-top: 0;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.result-display {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.result-display h3 {
  margin-top: 0;
  color: #606266;
}

.result-display pre {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tag-input-container {
  margin-bottom: 20px;
}

.tag-input {
  margin-bottom: 15px;
}

.tag-list {
  margin-bottom: 15px;
}

.music-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.tag-tips {
  color: #909399;
  font-size: 12px;
}

.test-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
