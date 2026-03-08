# CORE
## 修复说明
- 修复 UploadRequestFactory实例导出丢失this问题
- [20241120] 处理文件上传请求时请求头令牌设置问题
- [20250308] 优化请求失败提示信息
## 说明:
> 用于辅助前端开发的工具包
- 【RequestFactory】基于Axios封装的标准化前端请求模块
- 【UploadRequestFactory】提供Element-Plus组件upload分片上传或者WangEditor编辑器文件分片上传的标准化请求处理器，也可用于其他受支持的上传模块
- 【ProgressComputing】用于提供符合实际情况的进度值计算的工具，比如它可以借助Vue组件的onMounte 和 onUnmounted钩子函数实现页面需要多组件耗时加载的统一进度展示功能。
- 【utils】基本工具库，后期还将扩充

 ```getFileMd5``` 获取文件的MD5
 ```precision``` 精度控制
 ```debounce``` 防抖
 ```throttle``` 节流
## 使用
### 安装
``` shell
yarn add hiback@latest
```
OR
``` shell
npm install hiback@latest
```
### 定义配置文件 axiosConfig.ts
``` javascript
const config:AxiosConfig={
    baseUrl:'https://j.jq123.net',
    timeout:3000,
    bigUploadApi:'https://j.jq123.net/file/uploadBig',
    normalUploadApi:'https://j.jq123.net/file',
    refreshTokenApi:'system/user/refreshToken',
    signOutWhen401And403Time:500,
    useRefreshToken:false,
    // nextDo:()=>{
    //     return false
    // },
    headerHook:()=>{
        console.debug("尚未实现kconfig.api.headerHook")
    },
    signOut:()=>{
        throw new Error("请实现此Hook->sinOut")
    },
    token:()=>{
        return '---token---'
      },
    refreshToken:()=>{
       return '---refreshToken---'
    },
    saveToken:()=>{
        throw new Error("请实现此Hook->saveToken")
    },
    uploadNotify:(e:{uid:string|number,message:string})=>{
        console.info('kconfig.uploadHook.uploadNotify->e:%o',e)
    },
    messageBox:()=>{
        throw new Error("kconfig.ts尚未实现:messageBox(type:'error'|'success'|'warning'|'info',message:string)")
    },
    chunkSize: 1024 * 1024 * 1,
    merge(options:Optional<AxiosConfig>){
        for(const key in options){
            this[key] = options[key]
        }
    }
}
export default config
```
### 定义用于api请求的文件 request.ts
``` javascript
import build,{RequestOptionType, UploadRequestFactory} from 'hiback'
import axiosConfig from '@/config/axiosConfig'
import { ApiResultCodeType } from '@/types/framework'

const exports =build<ApiResultCodeType>(axiosConfig)
export default  exports.request
export const getAxiosResponse = exports.getAxiosResponse
export const responseProcess = exports.responseProcess
export const uploadRequest=(option: RequestOptionType)=>{
    const factory = new UploadRequestFactory<ApiResultCodeType>(axiosConfig)
    return factory.create(option)
}
export const config = axiosConfig
```
