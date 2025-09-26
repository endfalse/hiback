import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AjaxResult, AxiosConfig, Optional, RequestOptionType } from '../types';
declare class RequestFactory {
    private service;
    private get defaultInterceptor();
    private config;
    constructor(config: Optional<AxiosConfig>);
    get axiosConfig(): AxiosConfig;
    private get requests();
    private refreshToken;
    private messagePop;
    private isBizJsonResult;
    private showError;
    private getBody;
    private pickBizResponse;
    private resolveResponse;
    private processInvalidToken;
    responseProcess: (response: AxiosResponse) => Promise<any>;
    getAxiosResponse: (xhr: XMLHttpRequest, config: InternalAxiosRequestConfig | RequestOptionType) => AxiosResponse<AjaxResult, InternalAxiosRequestConfig>;
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