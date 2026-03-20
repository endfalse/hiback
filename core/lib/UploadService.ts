import { getBlobMd5, getFileMd5 } from "../utils/index"
import RequestFactory, { HibackError } from "./RequestService"
import { HibackRequestHeaders, UploadRequestOptions, UploadConfig, 
    UploadedFile, UploadedImage, UploadedVideo, UploadNotifyFunction, 
    UploadOptionsType, UploadRequestHandler } from '../types'
import { v4 as uuidv4 } from 'uuid';


export type ComplexUploaded = UploadedFile | UploadedImage | UploadedVideo
/**
 * @description 文件上传服务
 * @author kongjing
 * @date 2026.03.13
*/
export default class UploadService<TResponseCode=number>{
    private requestFactoryInstance
    private uploadNotify:UploadNotifyFunction
    private config: UploadConfig
    private uploadedChunks:number=0
    constructor(requestFactoryInstance:RequestFactory<TResponseCode>){
        this.requestFactoryInstance = requestFactoryInstance
        this.config = requestFactoryInstance.axiosConfig.fileUpload
        this.config.api = this.config.api||'/upload'
        this.config.chunkSize = this.config.chunkSize ||10 * 1024 * 1024
        this.config.batchSize = this.config.batchSize||12
        this.uploadNotify = this.config.uploadNotify||(()=>{})
    }

    /**
     * @description 提供通用文件上传的封装
     * @author kongjing
     * @date 2026.03.13
     * */ 
    public async upload(file:File, opts: UploadOptionsType) {
        const requestOpts = {
            api: opts.api,
            method: 'post',
            file,
            data: opts.data,
            headers: opts.headers,
            uploadNotify: opts.uploadNotify
        }
        let ret:ComplexUploaded | ComplexUploaded[] |undefined
        if(opts.chunk!==true){
          ret = await this.normalUpload(requestOpts)
        }
        else{
            ret = await this.uploadChunks({
                method: 'post',
                file: file,
                data: opts.data,
                headers: opts.headers,
                uploadNotify: opts.uploadNotify
            })
        }
        return ret
    }

     /**
     * @description 提供文件上传的封装，使用与el-plus和编辑器文件上传等配置
     * @author kongjing
     * @date 2026.03.13
     * */ 
    public async httpRequest(option:UploadRequestOptions&{chunk:boolean}) : Promise<UploadRequestHandler>{
        if (typeof XMLHttpRequest === 'undefined'){
            throw new HibackError(`[XMLHttpRequest is undefined`)
        }

        return new Promise((reslove)=>{
            reslove(async (opts)=>{
               opts.method = option.method||'POST'
               opts.file.uid = opts.file.uid||uuidv4()
               const ret = await this.upload(option.file,{
                    data: opts.data, 
                    headers: opts.headers,
                    chunk:option.chunk,
                    api:opts.action,
                    uploadNotify:(e)=>{
                        opts.onProgress({
                            percent:e.progress,target:option.file
                        } as any)
                        //opts.onProgress({percent:e.progress,target:option.file} as any)
                    }
               })
               opts.onSuccess({code:200,data:ret,message:"上传完成"})
            })
        })
    }

    private async getUploadId(meta:{totalChunks:number,name:string,size:number,type:string,md5:string},
        data?:Record<string, string | Blob | [string | Blob, string]>,
        headers?:HibackRequestHeaders,
        api:string|undefined=undefined){
        const requestData = new FormData()
        // 传递partup参数，标识“初始化获取uploadId”
        requestData.append('partup', 'true') 
        requestData.append('md5',meta.md5) 
        requestData.append('fileName', meta.name)
        requestData.append('fileSize', meta.size as unknown as string)
        requestData.append('fileType', meta.type);
        requestData.append('totalChunks', meta.totalChunks as unknown as string)
        requestData.append('chunkSize', this.config.chunkSize as unknown as string)

        if(data){
            for(const key in data){
                requestData.append(key, data[key] as any)
            }
        }
        // 后端「请求上传返回上传ID」的接口地址，请替换为你的实际接口
        const uploadId = await this.requestFactoryInstance.request({
            url:api||this.config.api,
            data:requestData,
            method: 'post',
            headers
        },'multipart/form-data')

        return uploadId
    }

    private  async normalUpload(options:{
        api?:string,
        method:string,
        file:File,
        data?:Record<string, string | Blob | [string | Blob, string]>,
        headers?:HibackRequestHeaders,
        uploadNotify?:UploadNotifyFunction|undefined,
    }){
        const id = uuidv4()
        const formData = new FormData()
        formData.append('fileName', options.file.name)
        formData.append('file', options.file)
        if(options.data)
        {
            for(const key in options.data){
                formData.append(key, options.data[key] as any)
            }
        }

        // 调用后端分片上传接口，请替换为你的实际接口
        const response = await this.requestFactoryInstance.request({
            url:options.api||this.config.api,
            data:formData,
            method: 'post',
            headers:options.headers,
            timeout: 0
        },'multipart/form-data')
        options.uploadNotify&&options.uploadNotify({
            id,
            message:'上传完成',
            loaded:options.file.size,
            total:options.file.size,
            progress:100
        })
        return this.getResponseData(id,response)
    }

    private async uploadChunks(options:{
        api?:string,
        method:'post',
        uploadNotify?:UploadNotifyFunction|undefined,
        file:File,
        data?:Record<string, string | Blob | [string | Blob, string]>,
        headers?:HibackRequestHeaders
    }){
        return new Promise< ComplexUploaded | undefined>(async (resolve,reject)=>{
            this.uploadNotify = options.uploadNotify || this.uploadNotify
            const id = uuidv4()
            let finalResponse: ComplexUploaded | undefined; // 收集最终有效结果

            try{
                // 获取文件MD5
                const md5 =  await getFileMd5(id,options.file,this.uploadNotify)

                // 每批并发数（可配置）
                const batchSize = this.config.batchSize
                const totalChunks = Math.ceil(options.file.size / this.config.chunkSize)
                this.uploadNotify({id,message:'正在获取上传ID...', loaded:0,total:options.file.size,progress:0})
                const meta={totalChunks,name:options.file.name,size:options.file.size,type:options.file.type,md5}
                
                // 获取上传 ID
                const uploadId = await this.getUploadId(meta,options.data, options.headers,options.api)
                this.uploadNotify({id,message:'开始上传...', loaded:0,total:options.file.size,progress:0})

                //记录已完成的分片编号（用 Set 去重）
                const completedChunks = new Set<number>()

                // 分片上传核心逻辑：按批次处理
                for (let i = 0; i < totalChunks; i += batchSize) {
                    // 截取当前批次的分片编号（如 0-11, 12-23...）
                    const batchChunkNumbers = [];
                    for (let j = 0; j < batchSize && (i + j) < totalChunks; j++) {
                        batchChunkNumbers.push(i + j);
                    }

                    // 构建当前批次的上传 Promise
                    const batchPromises = batchChunkNumbers.map(async (chunkNumber) => {
                        const start = chunkNumber * this.config.chunkSize
                        const end = Math.min(start + this.config.chunkSize, meta.size)
                        // 切割文件，获取当前分片Blob
                        const chunkBlob = options.file.slice(start, end)
                        const currentResponse = await this.uploadChunkWithRetry(
                            {id,uploadId,chunkNumber,chunkBlob,...meta,completedChunks}, 
                            options.data, 
                            options.headers,
                            options.api,
                            this.config.maxRetries,
                            this.config.retryDelay
                        )
   
                        finalResponse = this.getResponseData(id, currentResponse) as ComplexUploaded

                        // 上传成功后：记录已完成的分片（Set 自动去重，并发安全）
                        completedChunks.add(chunkNumber)

                        return finalResponse
                    })

                    // 等待当前批次所有分片上传完成，再执行下一批
                    // 等待当前批次所有分片完成，捕获单个分片错误
                    const batchResults = await Promise.allSettled(batchPromises)
                    // 检查批次内是否有失败的分片
                    const failedChunks = batchResults.filter((result) => result.status === 'rejected')

                    if (failedChunks.length > 0) {
                        const {loaded,progress} = this.getUploadLoaded(completedChunks,options.file.size)
                        // 提取失败原因，方便排查
                        const failReasons = failedChunks.map((res) => (res as PromiseRejectedResult).reason).join('; ')
                        const error = new Error(`批次${i / batchSize + 1}有${failedChunks.length}个分片上传失败:${failReasons}`);
                        this.uploadNotify({ 
                            id, 
                            message: error.message, 
                            loaded,
                            total:options.file.size,
                            progress })

                        // 终止整个上传流程
                        reject(error)
                         // 避免后续执行
                        return
                    }
                }

                // 所有分片上传完成后：统一resolve收集到的有效结果
                if (finalResponse) {
                    this.uploadNotify({ 
                    id, 
                    message: '上传完成', 
                    loaded:options.file.size,
                    total:options.file.size,
                    progress: 100 })
                    resolve(finalResponse) 
                } else {
                    this.uploadNotify({ 
                    id, 
                    message: '所有分片上传完成，但未获取到有效结果', 
                    loaded:options.file.size,
                    total:options.file.size,
                    progress: 100 })
                    resolve(undefined);
                }
            }
            catch(error) {
                const err = error instanceof Error ? error : new Error('上传过程中发生未知错误')
                this.uploadNotify({ 
                    id, 
                    message: err.message, 
                    loaded:0,
                    total:options.file.size,
                    progress: 0 })
                reject(err)
            }
        })
    }
    
    private async uploadChunkWithRetry(
        chunkParams: {
            id:string,
            uploadId:string,
            chunkNumber:number,
            totalChunks:number, 
            name:string, 
            size:number,
            chunkBlob:Blob,
            completedChunks:Set<number>}, 
        data: any,
        headers: any,
        api?: string,
        maxRetries: number=3, // 默认最大重试3次
        retryDelay: number=1000 // 重试间隔1秒（可选，避免频繁重试）
    ): Promise<any> {


        let attempt = 0; // 当前重试次数

        // 上传前：传入“基于已完成分片的已上传大小”（无竞态）
        const {loaded:currentLoaded,progress} = this.getUploadLoaded(chunkParams.completedChunks,chunkParams.size)
        while (attempt < maxRetries) {
            try {
                // 尝试上传单个分片
                const response = await this.uploadChunk(
                    chunkParams,
                    data,
                    headers,
                    api
                )
                // 上传成功：返回结果
                return response;
            } catch (error) {
                attempt++; // 重试次数+1
                // 达到最大重试次数：抛出错误，终止重试
                if (attempt >= maxRetries) {
                    this.uploadNotify({
                        id: chunkParams.id,
                        loaded:currentLoaded,
                        total:chunkParams.size,
                        message: `分片 ${chunkParams.chunkNumber} 上传失败（已重试${maxRetries}次）`,
                        progress: progress,
                    })
                    throw error; // 抛出错误，让外层 Promise 变为 rejected
                }
                // 未达到最大次数：提示并重试
                this.uploadNotify({
                    id: chunkParams.id,
                    loaded:currentLoaded,
                    total:chunkParams.size,
                    message: `分片 ${chunkParams.chunkNumber} 上传失败，正在重试（${attempt}/${maxRetries}）`,
                    progress
                })
                // 重试前等待指定间隔（避免高频重试触发服务端限流）
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        // 理论上不会走到这里，兜底抛出错误
        throw new Error(`分片 ${chunkParams.chunkNumber} 上传失败，已达最大重试次数`);
    }

    private async uploadChunk(
        upMetadata:{id:string,uploadId:string,chunkNumber:number,totalChunks:number, name:string, size:number,chunkBlob:Blob,completedChunks:Set<number>}, 
        data?:Record<string, string | Blob | [string | Blob, string]>,headers?:HibackRequestHeaders,
        api:string|undefined=undefined)
    {
        this.uploadedChunks++

        // 生成分片MD5（使用js-md5库）
        const chunkMd5 = await getBlobMd5(upMetadata.chunkBlob)
        // 构建FormData（参数完全匹配要求：uploadId、chunkMd5、chunkNumber、totalNumber、fileName、chunkSize）
        const formData = new FormData()
        formData.append('uploadId', upMetadata.uploadId)
        formData.append('chunkMd5', chunkMd5)
        formData.append('chunkNumber', upMetadata.chunkNumber as unknown as string) // 分片序号（从0开始，可根据后端要求调整为从1开始）
        formData.append('totalChunks', upMetadata.totalChunks as unknown as string) // 总分片数
        formData.append('fileName', upMetadata.name)
        formData.append('chunkSize', this.config.chunkSize as unknown as string);
        formData.append('chunkFile', upMetadata.chunkBlob, `${upMetadata.uploadId}_${upMetadata.chunkNumber}.tmp`) // 分片文件
        if(data)
        {
            for(const key in data){
                formData.append(key, data[key] as any)
            }
        }

        // 调用后端分片上传接口，请替换为你的实际接口
        const response = await this.requestFactoryInstance.request({
            url:api||this.config.api,
            data:formData,
            method: 'post',
            headers,
            timeout: 0
        },'multipart/form-data')

        //计算全局已上传大小
        const {loaded,progress} = this.getUploadLoaded(upMetadata.completedChunks,upMetadata.size)
        this.uploadNotify({ 
            id:upMetadata.id, 
            loaded,
            total:upMetadata.size,
            message: `第${upMetadata.chunkNumber + 1}/${upMetadata.totalChunks}个分片上传成功`,
            progress
        })
        return response
    }

    /**
     * 检查单个response项是否满足返回undefined的条件
     * @param {any} item - 单个响应项
     * @returns {boolean} 是否满足条件
     */
    private checkSingleResponse(item:any) {
        // 核心判断：仅检查status不等于3 或 file不存在/为假
        // 增加类型检查，避免访问属性时报错
        return typeof item === 'object' && item !== null 
            ? (item.status !== 3 || !item.file) 
            : false; // 非对象类型（如布尔/字符串等）不满足条件
    }

    private getResponseData(id: string, response: any): ComplexUploaded | ComplexUploaded[] | undefined {
        // 封装：解析单个 response 项为 ComplexUploaded
        const parseSingleItem = (itemResponse: any): ComplexUploaded | undefined => {
            // 1. 前置空值保护 + 条件判断（避免重复调用 checkSingleResponse）
            if (!itemResponse || !itemResponse.file || this.checkSingleResponse(itemResponse)) {
                return undefined;
            }

            // 2. 解构 file 属性并增加默认值，避免访问不存在的属性
            const {
                accessUrl,
                thumbnailUrl,
                uniqueId,
                width,
                height,
                posterUrl,
                duration,
                taskId
            } = itemResponse.file || {};

            // 3. 修复类型判断错误 + 简化分支逻辑
            // 基础文件（仅核心字段）
            if (uniqueId && accessUrl && thumbnailUrl) {
                return { id, uniqueId, accessUrl, thumbnailUrl, taskId } as ComplexUploaded;
            }

            // 图片（有宽高，无时长/海报）
            if (
                uniqueId && accessUrl && thumbnailUrl &&
                typeof width === 'number' && typeof height === 'number' &&
                typeof duration === 'undefined' && !posterUrl
            ) {
                return { id, uniqueId, accessUrl, thumbnailUrl, width, height, taskId } as ComplexUploaded;
            }

            // 视频（有海报/时长，无缩略图）
            if (
                uniqueId && accessUrl && posterUrl &&
                typeof width === 'number' && typeof height === 'number' &&
                typeof duration === 'number' && !thumbnailUrl
            ) {
                return { id, uniqueId, accessUrl, posterUrl, width, height, duration, taskId } as ComplexUploaded;
            }

            return undefined;
        };

        // 4. 先判断是否需要直接返回 undefined（仅执行一次 checkSingleResponse）
        const shouldReturnUndefined = Array.isArray(response)
            ? response.some(this.checkSingleResponse)
            : this.checkSingleResponse(response);

        if (shouldReturnUndefined) {
            return undefined;
        }

        // 5. 解析数据（数组/非数组分支简化）
        if (Array.isArray(response)) {
            const parsedList = response.map(parseSingleItem).filter(Boolean) as ComplexUploaded[];
            return parsedList.length > 0 ? parsedList : undefined;
        }

        return parseSingleItem(response);
    }

    private getUploadLoaded=(completedChunks:Set<number>,size:number)=>{
        const loaded = Array.from(completedChunks).reduce((sum, num) => {
            const s = num * this.config.chunkSize;
            const e = Math.min(s + this.config.chunkSize, size)
            return sum + (e - s)
        }, 0);
        const progress = Math.round((loaded / size) * 100)
        return {progress,loaded}
    }
}
