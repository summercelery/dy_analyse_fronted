# 抖音短视频分析系统 - 前端

基于 Vue 3 + Element Plus + Vite 构建的现代化前端应用。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Element Plus** - Vue 3 组件库
- **Vue Router** - 官方路由管理器
- **Pinia** - Vue 状态管理
- **Axios** - HTTP 客户端
- **ECharts** - 数据可视化图表库

## 项目结构

```
src/
├── api/           # API 接口定义
├── components/    # 公共组件
├── router/        # 路由配置
├── store/         # 状态管理
├── utils/         # 工具函数
├── views/         # 页面组件
├── App.vue        # 根组件
└── main.js        # 入口文件
```

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm run dev
```

项目将在 http://localhost:3000 启动，并自动代理 API 请求到后端服务 (http://localhost:8080)。

## 构建生产版本

```bash
npm run build
```

构建完成后，产物将输出到 `dist` 目录。

## 预览生产版本

```bash
npm run preview
```

## 主要功能

1. **用户认证**
   - 用户登录/注册
   - JWT Token 认证
   - 路由守卫

2. **数据概览**
   - 监控视频总览
   - 统计数据汇总
   - 快速导航

3. **监控管理**
   - 添加监控视频
   - 启用/停用监控
   - 删除监控视频

4. **数据统计**
   - 视频数据趋势图表
   - 多时间段数据对比
   - 实时数据更新

## API 代理配置

开发环境下，所有 `/api` 请求将被代理到后端服务：

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

## 组件自动导入

项目配置了 Element Plus 组件的自动导入，无需手动引入即可直接使用。

## 状态管理

使用 Pinia 进行状态管理，主要包括：

- `auth` - 用户认证状态
- API 请求拦截和错误处理
- Token 自动续期和过期处理