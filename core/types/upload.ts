import { HibackRequestHeaders } from "./typeTools";

//错误
export interface UploadAjaxError extends Error {
    name: string;
    status: number;
    method: string;
    url: string;
}

//进度事件参数
export interface UploadProgressEvent {
    id: string,
    loaded:number,
    total:number,
    progress: number,
    message?: string
}


export interface UploadRequestOptions {
    /**
     * 请求地址，不设置默认使用配置的bigUploadApi
    */
    action?: string,
    /**
     * 请求方法，不设置默认POST
    */
    method?: string,

    data: Record<string, string | Blob | [string | Blob, string]>,

    filename: string,

    file: File&{ uid?: number|string},
    /**
     * 不需要配置，使用配置的钩子函数即可
    */
    headers?: HibackRequestHeaders,

    onError: (evt: UploadAjaxError) => void,

    onProgress: (evt: UploadProgressEvent) => void,

    onSuccess: (response: any) => void,

    withCredentials: boolean,

    MD5Method:'file'|'fileInfo'|'uuidv4',

    chunk:boolean
}

// export interface UploadRawFile extends File {
//     uid: number|string;
// }



export type UploadRequestHandler = (options: UploadRequestOptions) => XMLHttpRequest | Promise<unknown>;

// export type HttpRequestOptionType = Omit<UploadRequestOptions,'data'>&{
//     data: Record<string, string | Blob | [string | Blob, string]>,
//     loaded?: number
// }