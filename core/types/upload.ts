import { AxiosRequestHeaders, RawAxiosRequestHeaders } from "axios";

export interface UploadRequestOptions {
    /**
     * 请求地址，不设置默认使用配置的bigUploadApi
    */
    action?: string;
    /**
     * 请求方法，不设置默认POST
    */
    method?: string;

    data: Record<string, string | Blob | [Blob, string]>;
    filename: string;
    file: File&{ uid?: number|string};
    /**
     * 不需要配置，使用配置的钩子函数即可
    */
    headers?: RawAxiosRequestHeaders | AxiosRequestHeaders;

    onError: (evt: UploadAjaxError) => void;
    onProgress: (evt: UploadProgressEvent) => void;
    onSuccess: (response: any) => void;
    withCredentials: boolean;
    MD5Method:'file'|'fileInfo'|'uuidv4'
}
export interface UploadRawFile extends File {
    uid: number|string;
}
export interface UploadAjaxError extends Error {
    name: string;
    status: number;
    method: string;
    url: string;
}
export interface UploadProgressEvent extends ProgressEvent {
    percent: number;
}

export type UploadRequestHandler = (options: UploadRequestOptions) => XMLHttpRequest | Promise<unknown>;

export type RequestOptionType = Omit<UploadRequestOptions,'data'>&{
    data: Record<string, string | Blob | [string | Blob, string]>,
    loaded?: number
}