import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";


declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _isRetryRequest?: boolean;
  }
}
export type TokenRequestHandlerConfigType={
    useRefreshToken: boolean,
    // 判断令牌过期（入参为Axios响应，返回布尔值）
    isTokenExpired: (response: AxiosResponse) => void,
    // 刷新令牌方法（返回Promise，使用者实现）
    refreshToken: ()=> Promise<void>,
    // 获取最新token的方法（使用者实现，用于重试时更新请求头）
    getLatestToken: ()=> string | null
}
/**
 * 令牌过期处理类（修复#pendingRequests完整逻辑）
 * 核心：收集并发请求 → 等待令牌刷新 → 统一重试/失败
 */
export default class TokenRequestHandler {
  // 配置项（带完整类型）
  config = {
    useRefreshToken: false,
    // 判断令牌过期（入参为Axios响应，返回布尔值）
    isTokenExpired: (response: AxiosResponse) => {
      const { status, data } = response;
      const errorMsg = (data?.msg || data?.message || '').toLowerCase();
      return [401, 403].includes(status) && 
             (errorMsg.includes('令牌过期') || errorMsg.includes('token expired'));
    },
    // 刷新令牌方法（返回Promise，使用者实现）
    refreshToken: async (): Promise<void> => {
      throw new Error('请配置config.refreshToken实现令牌刷新逻辑');
    },
    // 获取最新token的方法（使用者实现，用于重试时更新请求头）
    getLatestToken: (): string | null => {
      return localStorage.getItem('token') || null;
    }
  };

  constructor(config:TokenRequestHandlerConfigType){
    this.config.getLatestToken = config.getLatestToken||this.config.getLatestToken
    this.config.isTokenExpired = config.isTokenExpired||this.config.isTokenExpired
    this.config.refreshToken = config.refreshToken||this.config.refreshToken
    this.config.getLatestToken = config.getLatestToken||this.config.getLatestToken
    this.config.useRefreshToken= !!config.useRefreshToken
  }
  // 私有状态（完整队列逻辑）
  private isRefreshingToken = false;
  // 队列元素类型：保存重试请求的resolve/reject函数
  private pendingRequests: Array<{
    resolve: (value: AxiosResponse) => void;
    reject: (reason: AxiosError) => void;
    config: InternalAxiosRequestConfig;
  }> = [];

  /**
   * 处理请求错误（核心入口）
   */
  async handleRequestError1(error: AxiosError): Promise<AxiosResponse> {
    // 1. 基础校验：无响应/未启用刷新令牌 → 直接抛出
    if (!error.response || !this.config.useRefreshToken) {
      return Promise.reject(error);
    }

    const response = error.response;
    const originalRequest = error.config as InternalAxiosRequestConfig;

    try {
      // 2. 判断是否是令牌过期
      const isTokenExpired = this.config.isTokenExpired(response);
      if (!isTokenExpired) {
        return Promise.reject(error);
      }

      // 3. 防止循环重试：已标记过重试则直接失败
      if (originalRequest._isRetryRequest) {
        return Promise.reject(error);
      }
      originalRequest._isRetryRequest = true;

      // 4. 核心逻辑：处理令牌过期 + 并发请求队列
      return new Promise((resolve, reject) => {
        // 4.1 将当前请求加入等待队列
        this.pendingRequests.push({ resolve, reject, config: originalRequest });

        // 4.2 未在刷新令牌 → 执行刷新逻辑
        if (!this.isRefreshingToken) {
          this.refreshTokenAndRetry();
        }
      });
    } catch (innerError) {
      console.error('令牌过期处理失败：', innerError);
      return Promise.reject({ ...error, innerError });
    }
  }
/**
   * 处理请求错误（核心入口，保证返回值链路完整）
   * @param error Axios错误对象
   * @returns Promise<AxiosResponse> 最终的请求结果（重试成功/失败）
   */
  async handleRequestError(error: AxiosError,showErrorWhenNotTokenExpired:undefined|(()=>void)=undefined): Promise<AxiosResponse> {
    // 1. 基础校验：无响应/未启用刷新令牌 → 直接抛出（返回值链路1）
    if (!error.response || !this.config.useRefreshToken) {
      showErrorWhenNotTokenExpired&&showErrorWhenNotTokenExpired();
      return Promise.reject(error);
    }

    const response = error.response;
    const originalRequest = error.config as InternalAxiosRequestConfig;

    // 2. 判断是否是令牌过期 → 非过期则抛出（返回值链路2）
    const isTokenExpired = this.config.isTokenExpired(response);
    if (!isTokenExpired) {
      showErrorWhenNotTokenExpired&&showErrorWhenNotTokenExpired();
      return Promise.reject(error);
    }

    // 3. 防止循环重试 → 已重试则抛出（返回值链路3）
    if (originalRequest._isRetryRequest) {
      return Promise.reject(error);
    }
    originalRequest._isRetryRequest = true;

    // 4. 核心逻辑：处理令牌过期 + 并发队列（保证返回值链路完整）
    return new Promise((resolve, reject) => {
      // 4.1 将当前请求的resolve/reject存入队列（关键：绑定返回值）
      this.pendingRequests.push({ resolve, reject, config: originalRequest });

      // 4.2 未在刷新令牌 → 执行刷新逻辑（仅第一个请求触发）
      if (!this.isRefreshingToken) {
        // 关键：await 刷新逻辑，确保异常能被捕获并传递给队列
        this.refreshTokenAndRetry().catch(refreshErr => {
          // 刷新令牌本身失败 → 拒绝所有队列请求
          this.pendingRequests.forEach(({ reject }) => {
            reject(new AxiosError(
              '刷新令牌失败，请重新登录',
              'REFRESH_TOKEN_FAILED',
              undefined,
              undefined,
              (refreshErr as AxiosError)?.response
            ));
          });
          // 清空队列 + 释放锁
          this.pendingRequests = [];
          this.isRefreshingToken = false;
        });
      }
    });
  }

  /**
   * 内部方法：刷新令牌并重试队列中的请求
   * @private
   */
  private async refreshTokenAndRetry(): Promise<void> {
    this.isRefreshingToken = true;

    try {
      // 1. 执行刷新令牌（使用者实现的逻辑）
      await this.config.refreshToken();
      const latestToken = this.config.getLatestToken();

      // 2. 刷新成功：更新请求头 + 重试所有等待的请求
      this.pendingRequests.forEach(({ resolve, reject, config }) => {
        // 2.1 更新请求头的token（关键：重试时用新token）
        if (latestToken && config.headers) {
          config.headers.Authorization = `Bearer ${latestToken}`;
        }

        // 2.2 重试请求并解析结果
        axios(config)
          .then(res => resolve(res))
          .catch(err => reject(err));
      });
    } catch (refreshError) {
      // 3. 刷新失败：拒绝所有等待的请求
      this.pendingRequests.forEach(() => {//{ reject }
            const isAxiosError = (err: unknown): err is AxiosError => {
                return err instanceof AxiosError;
            };
            const errorResponse = isAxiosError(refreshError) ? refreshError.response : undefined;

            // 3. 拒绝队列请求：传入标准化的AxiosError
            this.pendingRequests.forEach(({ reject }) => {
                reject(new AxiosError(
                '刷新令牌失败，请重新登录',
                'REFRESH_TOKEN_FAILED',
                undefined,
                undefined,
                errorResponse
                ));
            });
       });
      console.error('刷新令牌失败：', refreshError);
    } finally {
      // 4. 重置状态：清空队列 + 释放锁
      this.pendingRequests = [];
      this.isRefreshingToken = false;
    }
  }
}

// // ---------------------- 完整使用示例 ----------------------
// // 1. 初始化处理器
// const tokenHandler = new TokenRequestHandler({
//   useRefreshToken: true,
//   // 自定义令牌过期判断（适配业务）
//   isTokenExpired: (response) => {
//     return response.status === 401 && response.data?.code === 10001;
//   },
//   // 实现刷新令牌逻辑
//   refreshToken: async () => {
//     const refreshToken = localStorage.getItem('refreshToken');
//     if (!refreshToken) throw new Error('无刷新令牌');

//     const res = await axios.post('/api/refresh-token', { refreshToken });
//     if (res.data.code !== 200) throw new Error(res.data.msg || '刷新失败');

//     // 更新本地令牌
//     localStorage.setItem('token', res.data.data.token);
//     localStorage.setItem('refreshToken', res.data.data.refreshToken);
//   },
//   // 实现获取最新token的方法
//   getLatestToken: () => {
//     return localStorage.getItem('token');
//   }
// });

// // 3. 集成到Axios响应拦截器
// axios.interceptors.response.use(
//   (response) => response,
//   (error: AxiosError) => tokenHandler.handleRequestError(error)
// );

// // ---------------------- 测试并发请求场景 ----------------------
// // 模拟令牌过期时的3个并发请求
// const request1 = axios.get('/api/user');
// const request2 = axios.get('/api/order');
// const request3 = axios.get('/api/product');

// // 所有请求会等待令牌刷新完成后重试，而非直接失败
// Promise.all([request1, request2, request3])
//   .then(resList => console.log('所有请求重试成功：', resList))
//   .catch(err => console.log('请求失败：', err));