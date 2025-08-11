<template>
  <div class="test-container">
    <h1>音乐标签管理功能测试</h1>
    
    <el-card class="test-card">
      <template #header>
        <span>标签输入测试</span>
      </template>
      
      <el-form :model="testForm" label-width="100px">
        <el-form-item label="标签">
          <div class="tag-input-container">
            <el-input 
              v-model="newTag"
              placeholder="输入标签后按回车添加"
              @keyup.enter="addTag"
              class="tag-input"
            >
              <template #append>
                <el-button @click="addTag" :disabled="!newTag.trim()">添加</el-button>
              </template>
            </el-input>
            
            <div class="tag-list" v-if="testForm.tags.length > 0">
              <el-tag
                v-for="(tag, index) in testForm.tags"
                :key="index"
                closable
                @close="removeTag(index)"
                class="test-tag"
              >
                {{ tag }}
              </el-tag>
            </div>
            
            <div class="tag-tips">
              <small>提示：标签用于分类和搜索，建议使用2-5个标签</small>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <div class="test-results">
        <h4>测试结果：</h4>
        <p><strong>标签数组：</strong>{{ testForm.tags }}</p>
        <p><strong>JSON格式：</strong>{{ JSON.stringify(testForm.tags) }}</p>
        <p><strong>逗号分隔：</strong>{{ testForm.tags.join(', ') }}</p>
      </div>
    </el-card>
    
    <el-card class="test-card">
      <template #header>
        <span>API接口测试</span>
      </template>
      
      <div class="api-test-buttons">
        <el-button @click="testGetMusicTags">获取音乐标签</el-button>
        <el-button @click="testAddMusicTag">添加音乐标签</el-button>
        <el-button @click="testRemoveMusicTag">移除音乐标签</el-button>
        <el-button @click="testSetMusicTags">设置音乐标签</el-button>
      </div>
      
      <div class="api-results">
        <h4>API测试结果：</h4>
        <pre>{{ apiResults }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { musicApi } from '@/api/music'
import { ElMessage } from 'element-plus'

const testForm = ref({
  tags: []
})

const newTag = ref('')
const apiResults = ref('')

const addTag = () => {
  if (!newTag.value.trim()) return
  if (testForm.value.tags.length >= 10) {
    ElMessage.warning('标签数量不能超过10个')
    return
  }
  if (newTag.value.length > 20) {
    ElMessage.warning('单个标签长度不能超过20个字符')
    return
  }
  if (testForm.value.tags.includes(newTag.value.trim())) {
    ElMessage.warning('该标签已存在')
    return
  }
  testForm.value.tags.push(newTag.value.trim())
  newTag.value = ''
}

const removeTag = (index) => {
  testForm.value.tags.splice(index, 1)
}

const testGetMusicTags = async () => {
  try {
    const response = await musicApi.getMusicTags(1) // 测试音乐ID为1
    apiResults.value = JSON.stringify(response, null, 2)
  } catch (error) {
    apiResults.value = `错误: ${error.message}`
  }
}

const testAddMusicTag = async () => {
  try {
    const response = await musicApi.addMusicTag(1, '测试标签')
    apiResults.value = JSON.stringify(response, null, 2)
  } catch (error) {
    apiResults.value = `错误: ${error.message}`
  }
}

const testRemoveMusicTag = async () => {
  try {
    const response = await musicApi.removeMusicTag(1, '测试标签')
    apiResults.value = JSON.stringify(response, null, 2)
  } catch (error) {
    apiResults.value = `错误: ${error.message}`
  }
}

const testSetMusicTags = async () => {
  try {
    const tags = testForm.value.tags.join(',')
    const response = await musicApi.setMusicTags(1, tags)
    apiResults.value = JSON.stringify(response, null, 2)
  } catch (error) {
    apiResults.value = `错误: ${error.message}`
  }
}
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 20px;
}

.tag-input-container {
  width: 100%;
}

.tag-input {
  margin-bottom: 10px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.test-tag {
  margin: 0;
}

.tag-tips {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.test-results {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.api-test-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.api-results {
  margin-top: 20px;
}

.api-results pre {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}
</style>