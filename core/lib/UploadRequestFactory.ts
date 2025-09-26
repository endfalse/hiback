import { AjaxResult, AxiosConfig, Optional } from "../types/index"
import { AjaxResultCode } from "../enums/system"
import RequestFactory from "./RequestFactory"
import { getFileMd5 } from "../utils/index"
import { RequestOptionType, UploadAjaxError, UploadProgressEvent, UploadRequestHandler, UploadRequestOptions } from "../types/upload"
import kconfig from '../kconfig'
import { AxiosRequestHeaders, AxiosResponse, RawAxiosRequestHeaders } from "axios"
import { v4 as uuidv4 } from 'uuid';
class HibackError extends Error {
  constructor(m: string) {
    super(m)
    this.name = "HibackError"
  }
}

class UploadRequestFactory{
    //默认文件分片上传大小
    private chunkSize:number = 1024 * 1024 * 1
    private uploadNotify:(e:{uid:string|number,message:string})=>void
    private request;
    constructor(config: Optional<AxiosConfig>){
        for(const key in kconfig){
            if(config[key]===undefined){
                config[key] = kconfig[key]
            }
        }
        this.uploadNotify = kconfig.uploadNotify
        this.chunkSize = kconfig.chunkSize
        this.request = new RequestFactory(config)
    }
    public create=(option:RequestOptionType)=>{
        return this.httpRequest(option)
    }

    private getError (
            action: string,
            option: RequestOptionType,
            xhr: XMLHttpRequest
        ) {
            let msg: string
            if (xhr.response) {
                msg = `${xhr.response.error || xhr.response}`
            } else if (xhr.responseText) {
                msg = `${xhr.responseText}`
            } else {
                msg = `fail to ${option.method} ${action} ${xhr.status}`
            }
            return {message: msg, status:xhr.status, method:option.method, url:action} as UploadAjaxError
    }
    private isNil(value: string | number | null | undefined) {
        return value === null || value === undefined;
    }
    //文件切片
    private sliceFile (file:File, chunkSize = 1024 * 1024 * 2)  {
        const chunks:Blob[] = [];
        let start = 0;
        let end;
        while (start < file.size) {
            end = Math.min(start + chunkSize, file.size);
            chunks.push(file.slice(start, end));
            start = end;
        }
        return chunks;
    }

    //下一步响应处理兼容本框架异步axos封装逻辑
    private async nextProcess (xhr:XMLHttpRequest,option:RequestOptionType,uploadIfNot:((uploadedMap:string[])=>void)|undefined =undefined):Promise<AjaxResult|undefined>
    {
        const response =  this.request.getAxiosResponse(xhr,option)
        const unwapperFun=(nativeResponse: AxiosResponse<AjaxResult,any>):any=>{
            const ajaxResult =nativeResponse.data
            if(typeof(ajaxResult.code)==='undefined'){
                throw new Error('返回的数据格式错误')
            }
            if(ajaxResult.code == AjaxResultCode.uploadInstant){
                option.loaded=option.file.size
                option.onProgress({percent:100,message:ajaxResult.message} as any)
                const ret ={code:AjaxResultCode.uploadInstant,data:ajaxResult.data,message:ajaxResult.message}
                option.onSuccess(ret)
                return ret
            }
            else if (ajaxResult.code == AjaxResultCode.Success) {
                option.onProgress({percent:100,message:ajaxResult.message} as any)
                const ret ={code:AjaxResultCode.Success,data:ajaxResult.data,message:ajaxResult.message}
                option.onSuccess(ret)
                return ret
            }
            else if(ajaxResult.code == AjaxResultCode.uploadSuccessPart){
                uploadIfNot&&uploadIfNot(ajaxResult.data?ajaxResult.data.split(''):[])
            }
            else if(ajaxResult.code === AjaxResultCode.unUpload)
            {
                uploadIfNot&&uploadIfNot([])
            }
            else{
                throw new Error('返回的数据格式错误')
            }
        }
        this.request.axiosConfig.unPackResponse!=this.request.axiosConfig.unPackResponse||unwapperFun
        return await this.request.responseProcess(response)
    }

    private setHeaders(xhr:XMLHttpRequest,headers:RawAxiosRequestHeaders | AxiosRequestHeaders,withCredentials:boolean){
        xhr.withCredentials = withCredentials
        headers = headers || {}
        this.request.axiosConfig?.headerHook(headers)
        if (headers instanceof Headers) {
            headers.forEach((value, key) => xhr.setRequestHeader(key, value))
        } 
        else {
            for (const [key, value] of Object.entries(headers)) {
                if (this.isNil(value)) continue
                xhr.setRequestHeader(key, String(value))
            }
        }
    }

    //执行文件分片上传
    private uploadCore(md5:string, option:RequestOptionType, uploadedMap:string[]){
        return new Promise<boolean>(resolve=>{
            const fileslices = this.sliceFile(option.file,this.chunkSize);
            let currentIndex =0
            const xhr = new XMLHttpRequest()
            xhr.addEventListener('load', async () => {
                const ret = await this.nextProcess(xhr,option)
                if(!!ret&&(ret.code === AjaxResultCode.uploadInstant||ret.code === AjaxResultCode.Success))
                {
                    resolve(true)
                }
                currentIndex++
                sendAjax()
            })
            xhr.addEventListener('error', () => 
                this.getError(option.action!, option as UploadRequestOptions, xhr)
            )
            if (option.withCredentials && 'withCredentials' in xhr) {
                xhr.withCredentials = true
            }
            let lastIndex = uploadedMap.lastIndexOf('1')
            lastIndex = lastIndex==-1?fileslices.length-1:lastIndex
            const sendAjax=()=>{
                while(currentIndex<fileslices.length){
                const blob =  fileslices[currentIndex]
                if(!blob) continue
                const unUploaded = uploadedMap[currentIndex]!=='1'
                if(unUploaded){
                    let data = new FormData();
                    data.append("totalNumber", fileslices.length.toString())
                    data.append("chunkSize", this.chunkSize.toString())
                    data.append("chunkNumber", currentIndex.toString())
                    data.append("md5", md5)
                    const file = new File([blob],option.file.name)
                    data.append("file",file ,option.file.name)
                    //原始表单额外数据尚未添加
                    if (option.data) {
                        for (const [key, value] of Object.entries(option.data)) {
                        if(key==='md5') continue
                        if (Array.isArray(value) && value.length) data.append(key, (value as any))
                        else data.append(key, value)
                        }
                    }
                    xhr.open(option.method!,option.action!, true)
                    this.setHeaders(xhr,option.headers!,option.withCredentials && 'withCredentials' in xhr)
                    xhr.send(data)
                }
                option.loaded=(option.loaded||0) + blob.size
                const progressEvt:UploadProgressEvent={} as any;
                progressEvt.percent = option.file.size > 0 ? (option.loaded / option.file.size) * 100 : 0
                progressEvt.percent=progressEvt.percent>=100?100:progressEvt.percent
                option.onProgress(progressEvt)
                if(!unUploaded){
                    currentIndex++
                    continue
                }
                break
                }
            }
            sendAjax()
        })
    }

    /**
     * @description 提供文件上传的封装，使用与el-plus和编辑器文件上传等配置
     * @author kongjing
     * @date 2024.11.11
     * */ 
    private async httpRequest(option:RequestOptionType) : Promise<UploadRequestHandler> {
        if (typeof XMLHttpRequest === 'undefined'){
            throw new HibackError(`[XMLHttpRequest is undefined`)
        }
        option.action = option.action || this.request.bigUploadApi
        option.method = option.method||'POST'

        option.file.uid = option.file.uid||option.file.name


        this.uploadNotify({uid:option.file.uid,message:'正在计算中...'})

        const md5 = option.MD5Method==='uuidv4'? uuidv4():  (await getFileMd5(option.file,(percent)=>{
            this.uploadNotify({uid:option.file.uid!,message:`正在计算中...${percent.toFixed(0)}%`})
        },option.MD5Method=='fileInfo'))

        /***
         * 当为Promise时elupload内部将根据resolve调用一次onSucces，
         * 当前封装的上传逻辑不需要本次默认的调用而是需要根据其内部异步处理逻辑更具处理进度情况调用
         * by kongj 2024.0913
         **/
        return new Promise(_=>{
            const xhr = new XMLHttpRequest()
            var urlParams = new URLSearchParams()
            urlParams.append("title",option.file.name)
            urlParams.append("md5",md5)
            if (option.data) {
                for (const [key, value] of Object.entries(option.data)) {
                    if (Array.isArray(value) && value.length) urlParams.append(key, (value as any))
                    else urlParams.append(key, value as string)
                }
            }
            this.uploadNotify({uid:option.file.uid!,message:'稍等，正在上传中...'})
            xhr.addEventListener('load',async ()=>{
                const result = await  this.nextProcess(xhr,option,async (uploadedMap)=>{
                    option.loaded=0
                    //非秒传文件时进行分片上传-如果文件较小同样适用分片逻辑
                    const complete =await  this.uploadCore(md5,option,uploadedMap)
                    complete&&this.uploadNotify({uid:option.file.uid!,message:''})
                })
                if(result&&result.code==AjaxResultCode.uploadInstant){
                    this.uploadNotify({uid:option.file.uid!,message:''})
                }
            })
            xhr.addEventListener('error', () => {
                option.onError( this.getError(option.action!, option, xhr))
            }) 
            xhr.open('get',`${option.action}/preCheck?${urlParams.toString()}`,true)
            this.setHeaders(xhr,option.headers!,true)
            xhr.send(urlParams)
        })
    }
}

export default UploadRequestFactory