import { AxiosError, AxiosResponse } from "axios";
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        _isRetryRequest?: boolean;
    }
}
export type TokenRequestHandlerConfigType = {
    useRefreshToken: boolean;
    isTokenExpired: (response: AxiosResponse) => void;
    refreshToken: () => Promise<void>;
    getLatestToken: () => string | null;
};
/**
 * 令牌过期处理类（修复#pendingRequests完整逻辑）
 * 核心：收集并发请求 → 等待令牌刷新 → 统一重试/失败
 */
export default class TokenRequestHandler {
    config: {
        useRefreshToken: boolean;
        isTokenExpired: (response: AxiosResponse) => any;
        refreshToken: () => Promise<void>;
        getLatestToken: () => string | null;
    };
    constructor(config: TokenRequestHandlerConfigType);
    private isRefreshingToken;
    private pendingRequests;
    /**
     * 处理请求错误（核心入口）
     */
    handleRequestError1(error: AxiosError): Promise<AxiosResponse>;
    /**
       * 处理请求错误（核心入口，保证返回值链路完整）
       * @param error Axios错误对象
       * @returns Promise<AxiosResponse> 最终的请求结果（重试成功/失败）
       */
    handleRequestError(error: AxiosError, showErrorWhenNotTokenExpired?: undefined | (() => void)): Promise<AxiosResponse>;
    /**
     * 内部方法：刷新令牌并重试队列中的请求
     * @private
     */
    private refreshTokenAndRetry;
}
//# sourceMappingURL=TokenRequestHandler.d.ts.map