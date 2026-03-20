import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import RequestService from "./RequestService";
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        _isRetryRequest?: boolean;
    }
}
export type TokenRequestHandlerConfigType = {
    useRefreshToken: boolean;
    isTokenExpired?: (response: AxiosResponse) => void;
    refreshToken: () => Promise<string>;
};
/**
 * 令牌过期处理类（修复#pendingRequests完整逻辑）
 * 核心：收集并发请求 → 等待令牌刷新 → 统一重试/失败
 */
export default class TokenRequestHandler<TResponseCode = number> {
    config: {
        useRefreshToken: boolean;
        reSendRequest: <T = any, D = any>(config: AxiosRequestConfig<D>, reslove: (response: AxiosResponse<T, D, {}>) => void, reject: (error: AxiosError<T, D>) => void) => void;
        isTokenExpired: (response: AxiosResponse) => any;
        refreshToken: () => Promise<string>;
        getLatestToken: () => string | null;
    };
    private requestServer;
    constructor(requestServer: RequestService<TResponseCode>, config: TokenRequestHandlerConfigType);
    private isRefreshingToken;
    private pendingRequests;
    private getAxiosError;
    /**
     * 处理请求错误（核心入口，保证返回值链路完整）
     * @param error Axios错误对象
     * @returns Promise<AxiosResponse> 最终的请求结果（重试成功/失败）//,showErrorWhenNotTokenExpired:undefined|(()=>void)=undefined
     */
    handleRequestError(error: AxiosError): Promise<AxiosResponse>;
    /**
     * 内部方法：刷新令牌并重试队列中的请求
     * @private
     */
    private refreshTokenAndRetry;
}
//# sourceMappingURL=TokenRequestHandler.d.ts.map