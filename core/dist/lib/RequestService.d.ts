import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AjaxResult, AxiosConfig, ContentType, Optional, UploadOptionsType } from '../types';
export declare class HibackError extends Error {
    constructor(m: string);
}
/**
 * @description 请求服务
 * @author kongjing
 * @date 2026.03.13
*/
declare class RequestService<TResponseCode = number> {
    private service;
    private uploadService;
    private get defaultInterceptor();
    private config;
    private isDevelopment;
    constructor(config: Optional<AxiosConfig<TResponseCode>>);
    get axiosConfig(): AxiosConfig<TResponseCode>;
    private messagePop;
    private isBizJsonResult;
    /**
     * 规范化拼接 URL，自动处理重复斜杠问题
     * @param baseURL - 基础地址（如 https://api.example.com/）
     * @param url - 接口路径（如 /user/list）
     * @returns 规范化的完整 URL
     */
    private normalizeUrl;
    /**
     * 校验 URL 是否合法
     * @param url - 待校验的 URL 字符串
     * @returns 是否合法
     */
    private isUrlValid;
    private showError;
    private defaultResponseAdapter;
    private resolveResponse;
    /**
     * 处理响应入口
    */
    responseProcess: (response: AxiosResponse<AjaxResult<TResponseCode>>) => Promise<any>;
    /**
     * 从Http相应获取重新包装的响应内容
    */
    getAxiosResponse: <T = AjaxResult<TResponseCode>, D = any>(xhr: XMLHttpRequest, requestConfig?: Optional<InternalAxiosRequestConfig<D>>) => AxiosResponse<T, D>;
    /**
     * 将 XHR 响应转换为 AxiosResponse 实例
     * @param xhr XHR 实例
     * @param requestConfig 请求配置（构造 config 字段）
     * @returns 符合 AxiosResponse 规范的实例
     */
    convertXhrToAxiosResponse<T = any, D = any>(xhr: XMLHttpRequest, requestConfig?: Optional<InternalAxiosRequestConfig<D>>): AxiosResponse<T, D>;
    private parseResponseHeaders;
    uploadFile(file: File, opts: UploadOptionsType): Promise<import("./UploadService").ComplexUploaded | import("./UploadService").ComplexUploaded[] | undefined>;
    get uploadRequestHandler(): import("..").UploadRequestHandler;
    /**
     * @description 系统前端开发快速应用接口的能力，并提供标准的接口请求和响应处理
     * @author kongjing
     * @date 2022.10.12
    */
    request: <T = any, D = any>(config: AxiosRequestConfig<D>, contentType?: ContentType | undefined) => Promise<T>;
    /**
     * @description 适配相应为标准处理
     * @author kongjing
     * @date 2026.03.11
     */ responseAdapter<TRetData = any, TRequestData = any>(nativeResponse: AxiosResponse<AjaxResult<TResponseCode, TRetData>, TRequestData>): Promise<TRetData>;
}
export default RequestService;
//# sourceMappingURL=RequestService.d.ts.map