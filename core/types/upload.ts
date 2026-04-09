import { HibackRequestHeaders, HibackUploadData } from "./typeTools";

//错误
export interface UploadAjaxError extends Error {
    name: string;
    status: number;
    method: string;
    url: string;
}

//进度事件参数
export interface UploadProgressEvent{// extends ProgressEvent 
    id: string,
    loaded:number,
    total:number,
    percent: number,
    message?: string,
    target?:UploadRawFile
}
interface UploadRawFile extends File {
  uid: number;
  isDirectory?: boolean;
}

export interface UploadRequestOptions{
    /**
     * 请求地址，不设置默认使用配置的bigUploadApi
    */
    action?: string,
    /**
     * 请求方法，不设置默认POST
    */
    method?: string,

    data?: HibackUploadData,

    filename: string,

    file: UploadRawFile,//File&{ uid?: number|string},
    /**
     * 不需要配置，使用配置的钩子函数即可
    */
    headers?:HibackRequestHeaders,

    onError: (evt: UploadAjaxError) => void,

    onProgress: (evt: UploadProgressEvent) => void,

    onSuccess: (response: any) => void,

    withCredentials?: boolean,

    MD5Method?:'file'|'fileInfo'|'uuidv4',

    chunk?:boolean
}

export type UploadRequestHandler = (options: UploadRequestOptions) => XMLHttpRequest | Promise<unknown>;
