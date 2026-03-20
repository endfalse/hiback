import { AxiosResponse } from "axios";
import type TokenRequestHandler from '../lib/TokenRequestHandler'
import { HibackRequestHeaders } from "./typeTools";
import { UploadProgressEvent } from "./upload";
export * from './upload'
export * from './typeTools'

//export type UploadNotifyFunction = (e: {id:string,progress:number, message?:string})=>void

export type UploadNotifyFunction = (e:UploadProgressEvent)=>void

/**
 * Content-Type常量定义
 */
export const ContentTypes = {
    // 表单默认编码类型，适用于大多数文本表单提交
    FORM_URLENCODED: 'application/x-www-form-urlencoded',
    // 用于文件上传或包含二进制数据的表单
    MULTIPART_FORM_DATA: 'multipart/form-data',
    // JSON格式提交，适用于API接口
    JSON: 'application/json',
    // 纯文本提交
    TEXT_PLAIN: 'text/plain',
    // XML格式提交
    XML: 'application/xml'
}  as const
export type ContentType = typeof ContentTypes[keyof typeof ContentTypes]

/**
 * Axios 上传配置
 */
export type UploadConfig = {
    api:string;
    batchSize: number,
    chunkSize:number,
    maxRetries:number,
    retryDelay:number,
    uploadNotify?:UploadNotifyFunction
}

/**
 * Axios配置
 */
export interface AxiosConfig<TResponseCode=number>{
    baseUrl:string;
    refreshTokenApi:string;
    timeout?:number;
    fileUpload: UploadConfig,
    useRefreshToken:boolean;
    tokenRequestHandler?: TokenRequestHandler<TResponseCode>
    headerHook:(header: HibackRequestHeaders)=>void;
    signOut:(isInvalidRefreshToken:boolean)=>void,
    saveToken:(token:string,refreshToken:string|undefined)=>void;
    token:()=>string;
    refreshToken:()=>string;
    messageBox:(response:{status:number,code:TResponseCode,message:string})=>void;
    signOutWhen401And403Time?:number;
    responseAdapter?:<TRetData=any,TRequestData=any>(nativeResponse: AxiosResponse<AjaxResult<TResponseCode,TRetData>,TRequestData>)=>TRetData;
    [key:string]:any
}

/**
 * Axios 上传方法参数类型
 */
export type UploadOptionsType={
    uploadNotify:UploadNotifyFunction,
    data?: Record<string, string | Blob | [string | Blob, string]>, 
    headers?: HibackRequestHeaders,
    chunk?:boolean,
    api?:string
}

/**
 * 默认上传文件
 */
export type UploadedFile = {
    id:string,
    accessUrl: string,
    uniqueId: string,
    taskId?: string
}

/**
 * 图片类上传文件
 */
export type UploadedImage = UploadedFile&{
    width:number,
    height:number,
    thumbnailUrl:string
}

/**
 * 图片类上传文件
 */
export type UploadedVideo = UploadedFile&{
    width:number,
    height:number,
    posterUrl:string,
    duration:number
}

/**
 * @description axios 默认响应
*/
export interface AjaxResult<TResponseCode=number,T =any>
{
    code: TResponseCode,
    message: string,
    msg?: string,//容错
    data: T
}