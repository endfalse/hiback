# Hiback

一个用于辅助前端开发的强大工具包，提供标准化的HTTP请求、文件上传、进度计算等功能。

## ✨ 特性

- 🚀 **RequestFactory** 基于Axios封装的标准化前端请求模块，支持自动刷新令牌、请求/响应拦截
- 📦 **UploadRequestFactory** 提供Element-Plus组件upload分片上传或WangEditor编辑器文件分片上传的标准化请求处理器
- 📊 **ProgressComputing** 用于提供符合实际情况的进度值计算的工具，支持多组件耗时加载的统一进度展示
- 🛠 **Utils** 丰富的工具函数库

## 📦 安装

```bash
# npm
npm install hiback@latest

# yarn
yarn add hiback@latest

# pnpm
pnpm add hiback@latest
```

## 📚 快速开始

### 1. 基础配置

首先创建配置文件 `axiosConfig.ts`：

```typescript
import type { AxiosConfig } from 'hiback'

const axiosConfig: AxiosConfig = {
    baseUrl: import.meta.env.VITE_API_URL,
    timeout: 30000,
    bigUploadApi: '/api/upload/big',
    normalUploadApi: '/api/upload/normal',
    refreshTokenApi: '/api/auth/refresh',
    
    // 自定义请求头钩子
    headerHook: (headers) => {
        console.debug('请求头处理', headers)
    },
    
    // 获取token
    token: () => {
        return localStorage.getItem('token') || ''
    },
    
    // 获取refreshToken
    refreshToken: () => {
        return localStorage.getItem('refreshToken') || ''
    },
    
    // 保存新token
    saveToken: (token, refreshToken) => {
        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', refreshToken)
    },
    
    // 登出处理
    signOut: () => {
        localStorage.clear()
        window.location.href = '/login'
    },
    
    // 消息提示
    messageBox: (type, message) => {
        // 这里可以使用Element Plus的ElMessage或其他UI库
        console.log(`[${type}] ${message}`)
    },
    
    // 上传通知
    uploadNotify: (e) => {
        console.log(`文件[${e.uid}]: ${e.message}`)
    },
    
    // 分片大小，默认1MB
    chunkSize: 1024 * 1024 * 1
}

export default axiosConfig
```

### 2. 创建请求实例

创建 `request.ts` 文件：

```typescript
import { RequestFactory } from 'hiback'
import axiosConfig from './axiosConfig'
import type { AxiosRequestConfig } from 'axios'

// 创建请求工厂实例
const factory = new RequestFactory(axiosConfig)

// 导出请求方法
export const request = <T = any>(config: AxiosRequestConfig) => {
    return factory.request<T>(config)
}

// 导出响应处理工具
export const { getAxiosResponse, responseProcess } = factory

// 导出axios配置
export { axiosConfig }

export default request
```

### 3. 使用RequestFactory发送请求

```typescript
import request from './request'

// GET请求
export const getUserList = (params: any) => {
    return request({
        url: '/api/users',
        method: 'get',
        data: params
    })
}

// POST请求
export const createUser = (data: any) => {
    return request({
        url: '/api/users',
        method: 'post',
        data
    })
}

// PUT请求
export const updateUser = (id: number, data: any) => {
    return request({
        url: `/api/users/${id}`,
        method: 'put',
        data
    })
}

// DELETE请求
export const deleteUser = (id: number) => {
    return request({
        url: `/api/users/${id}`,
        method: 'delete'
    })
}
```

### 4. 使用UploadRequestFactory

#### Element Plus Upload 组件集成

```vue
<template>
  <el-upload
    drag
    action=""
    :http-request="uploadRequest"
    :on-success="handleSuccess"
    :on-error="handleError"
    :on-progress="handleProgress"
    multiple
  >
    <el-icon class="el-icon--upload">
      <upload-filled />
    </el-icon>
    <div class="el-upload__text">
      拖拽文件到此处或 <em>点击上传</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
        支持大文件分片上传，自动秒传已上传文件
      </div>
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UploadRequestFactory } from 'hiback'
import axiosConfig from './axiosConfig'

// 创建上传工厂
const uploadFactory = new UploadRequestFactory(axiosConfig)

// 自定义上传请求
const uploadRequest = (option: any) => {
  return uploadFactory.create(option)
}

// 上传成功回调
const handleSuccess = (response: any, file: any, fileList: any) => {
  console.log('上传成功', response)
}

// 上传失败回调
const handleError = (error: any, file: any, fileList: any) => {
  console.error('上传失败', error)
}

// 上传进度回调
const handleProgress = (event: any, file: any, fileList: any) => {
  console.log('上传进度', event.percent)
}
</script>
```

#### WangEditor 集成

```typescript
import { Boot } from '@wangeditor/editor'
import attachmentModule from '@wangeditor/plugin-attachment'
import { UploadRequestFactory } from 'hiback'
import axiosConfig from './axiosConfig'

const uploadFactory = new UploadRequestFactory(axiosConfig)

// 注册附件模块
Boot.registerModule(attachmentModule)

// 编辑器配置
const editorConfig = {
  MENU_CONF: {
    uploadAttachment: {
      server: '', // 留空，使用自定义上传
      customUpload: (file: File, insertFn: any) => {
        uploadFactory.create({
          file,
          action: axiosConfig.bigUploadApi,
          onSuccess: (res: any) => {
            const url = res.data.url
            insertFn(url, file.name)
          },
          onError: (err: any) => {
            console.error('上传失败', err)
          },
          onProgress: (progress: any) => {
            console.log('上传进度', progress.percent)
          }
        })
      }
    }
  }
}
```

### 5. 使用ProgressComputing

#### 新版API（推荐）

```vue
<template>
  <div>
    <el-progress :percentage="progress" />
    <ComponentA v-if="showA" @loaded="onComponentALoaded" />
    <ComponentB v-if="showB" @loaded="onComponentBLoadeded" />
    <ComponentC v-if="showC" @loaded="onComponentCLoaded" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ProgressComputing } from 'hiback'

const progress = ref(0)
const showA = ref(true)
const showB = ref(true)
const showC = ref(true)

// 创建进度计算器（新版API）
const progressCalculator = new ProgressComputing({
  growthRate: 0.3,
  deviation: 0.5,
  interval: 100,
  onProgress: (percent) => {
    progress.value = percent
  },
  onComplete: () => {
    console.log('所有组件加载完成！')
  }
})

// 记录组件
onMounted(() => {
  progressCalculator.record('componentA', 333)
  progressCalculator.record('componentB', 333)
  progressCalculator.record('componentC', 334)
  
  // 开始动画
  progressCalculator.start('componentA')
})

// 组件A加载完成
const onComponentALoaded = () => {
  progressCalculator.finish('componentA')
  progressCalculator.start('componentB')
}

// 组件B加载完成
const onComponentBLoadeded = () => {
  progressCalculator.finish('componentB')
  progressCalculator.start('componentC')
}

// 组件C加载完成
const onComponentCLoaded = () => {
  progressCalculator.finish('componentC')
}

onUnmounted(() => {
  // 销毁实例，清理资源
  progressCalculator.destroy()
})
</script>
```

#### 旧版API（向后兼容，已废弃）

```typescript
import { ProgressComputing } from 'hiback'

// 旧版调用方式仍然可用
const progressCalculator = new ProgressComputing(0.2, 0.5, 300)

progressCalculator.recordComponent('componentA', 100)
progressCalculator.recordComponent('componentB', 100)

progressCalculator.aniamteStart('componentA')
progressCalculator.finishComponent('componentA')
```

### 6. 使用工具函数

```typescript
import { utils } from 'hiback'

// 获取文件MD5
const file = new File(['hello'], 'test.txt')
utils.getFileMd5(file, (percent) => {
  console.log(`MD5计算进度: ${percent}%`)
}).then(md5 => {
  console.log(`文件MD5: ${md5}`)
})

// 使用文件信息快速生成MD5（不读取文件内容）
utils.getFileMd5(file, (percent) => {
  console.log(`快速MD5计算进度: ${percent}%`)
}, true).then(md5 => {
  console.log(`快速MD5: ${md5}`)
})

// 精度控制
const num = utils.precision(3.1415926, 2) // 3.14

// 防抖
const debouncedFn = utils.debounce(() => {
  console.log('防抖执行')
}, 500)

// 节流
const throttledFn = utils.throttle(() => {
  console.log('节流执行')
}, 500)

// 生成UUID
const uuid = utils.generateUUID()

// 格式化文件大小
const sizeText = utils.formatFileSize(1024 * 1024 * 2.5) // "2.5 MB"

// 检查文件类型
const isAllowed = utils.checkIsAllowFileType('application/pdf', ['pdf', 'doc'])
```

## 📖 API 文档

### RequestFactory

#### 构造函数

```typescript
new RequestFactory(config: Optional<AxiosConfig>)
```

#### 方法

- `request<T>(config: AxiosRequestConfig): Promise<T>` - 发送HTTP请求
- `responseProcess(response: AxiosResponse): Promise<any>` - 处理响应
- `getAxiosResponse(xhr: XMLHttpRequest, config): AxiosResponse` - 将XHR转换为Axios响应

### UploadRequestFactory

#### 构造函数

```typescript
new UploadRequestFactory(config: Optional<AxiosConfig>)
```

#### 方法

- `create(option: RequestOptionType): Promise<UploadRequestHandler>` - 创建上传请求

### ProgressComputing

#### 构造函数

```typescript
// 新版API（推荐）
new ProgressComputing(options: ProgressComputingOptions)

// 旧版API（向后兼容）
new ProgressComputing(growthRate: number, deviation: number, ms: number)
```

#### 配置选项 (ProgressComputingOptions)

```typescript
interface ProgressComputingOptions {
  growthRate?: number      // 增长速率，默认 0.3
  deviation?: number       // 完成偏差阈值，默认 0.5
  interval?: number        // 动画间隔(ms)，默认 100
  onProgress?: (percent: number) => void  // 进度变化回调
  onComplete?: () => void  // 完成回调
}
```

#### 新版方法（推荐）

- `record(uid: string, weight?: number)` - 记录需要加载的组件
- `finish(uid: string)` - 标记组件加载完成
- `start(uid?: string)` - 开始进度动画
- `pause()` - 暂停动画
- `reset()` - 重置所有进度
- `destroy()` - 销毁实例，清理资源
- `get percentage()` - 获取当前进度百分比
- `get completed()` - 检查是否已完成
- `setOnProgress(callback)` - 设置进度变化回调
- `setOnComplete(callback)` - 设置完成回调

#### 旧版方法（向后兼容，已废弃）

- `recordComponent(uid: string, total: number)` - 记录需要加载的组件
- `finishComponent(uid: string)` - 标记组件加载完成
- `aniamteStart(uid: string)` - 开始进度动画

### Utils

#### 函数列表

- `getFileMd5(file: File, callback: (percent: number) => void, useFileInfo?: boolean): Promise<string>` - 获取文件MD5
- `precision(f: number, digit: number): number` - 精度控制
- `debounce(fun: Function, span?: number): Function` - 防抖
- `throttle(fn: Function, interval?: number): Function` - 节流
- `generateUUID(): string` - 生成UUID
- `formatFileSize(bytes: number): string` - 格式化文件大小
- `checkIsAllowFileType(filetype: string, allowedTypes: FileType[]): boolean` - 检查文件类型

## 📁 项目结构

```
hiback/
├── core/                    # 核心库
│   ├── lib/                # 核心模块
│   │   ├── RequestFactory.ts      # 请求工厂
│   │   ├── UploadRequestFactory.ts # 上传工厂
│   │   └── ProgressComputing.ts    # 进度计算
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript类型定义
│   ├── enums/              # 枚举定义
│   ├── index.ts            # 入口文件
│   └── package.json
├── test/                   # 测试项目
└── README.md
```

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🔧 更新日志

### v2.2.0
- 🚀 **重大更新**：完全重构 ProgressComputing 模块，优化为生产环境可用版本
  - 修复所有已知bug，包括计时器清理、组件切换逻辑
  - 新增简洁API：`record()`、`finish()`、`start()`、`pause()`、`reset()`、`destroy()`
  - 支持进度变化回调和完成回调
  - 提供资源安全清理机制
  - 保持完全向后兼容

### v2.1.11
- 优化令牌刷新机制
- 修复UploadRequestFactory实例导出丢失this问题
- 处理文件上传请求时请求头令牌设置问题
