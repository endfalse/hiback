import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AjaxResult, AxiosConfig, Optional, RequestOptionType } from '../types';
declare class RequestFactory<TResponseCode = number> {
    private service;
    private get defaultInterceptor();
    private config;
    private KCONFIG;
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
    private showError;
    private getBody;
    private defaultResponseAdapter;
    private resolveResponse;
    responseProcess: (response: AxiosResponse<AjaxResult<TResponseCode>>) => Promise<any>;
    getAxiosResponse: (xhr: XMLHttpRequest, config: InternalAxiosRequestConfig | RequestOptionType) => AxiosResponse<AjaxResult<TResponseCode>, InternalAxiosRequestConfig>;
    get bigUploadApi(): string;
    get normalUploadApi(): string;
    /**
     * @description 系统前端开发快速应用接口的能力，并提供标准的接口请求和响应处理
     * @author kongjing
     * @date 2022.10.12
     */
    request: <T = any, D = any>(config: AxiosRequestConfig<D>) => Promise<T>;
}
export default RequestFactory;
//# sourceMappingURL=RequestFactory.d.ts.map