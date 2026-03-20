var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import axios, { AxiosError } from "axios";
/**
 * 令牌过期处理类（修复#pendingRequests完整逻辑）
 * 核心：收集并发请求 → 等待令牌刷新 → 统一重试/失败
 */
var TokenRequestHandler = /** @class */ (function () {
    function TokenRequestHandler(requestServer, config) {
        var _this = this;
        // 配置项（带完整类型）
        this.config = {
            useRefreshToken: false,
            reSendRequest: function (config, reslove, reject) {
                axios(config)
                    .then(function (response) { return reslove(response); })
                    .catch(function (error) { return reject(error); });
                //throw new Error('请配置config.reSendRequest实现请求重发');
            },
            // 判断令牌过期（入参为Axios响应，返回布尔值）
            isTokenExpired: function (response) {
                var status = response.status, data = response.data;
                var errorMsg = ((data === null || data === void 0 ? void 0 : data.msg) || (data === null || data === void 0 ? void 0 : data.message) || '').toLowerCase();
                return [401].includes(status) &&
                    (errorMsg.includes('令牌已过期')
                        || errorMsg.includes('令牌过期')
                        || (errorMsg.includes('令牌') && errorMsg.includes('过期'))
                        || errorMsg.includes('token expired'));
            },
            // 刷新令牌方法（返回Promise，使用者实现）
            refreshToken: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    throw new Error('请配置config.refreshToken实现令牌刷新逻辑');
                });
            }); },
            // 获取最新token的方法（使用者实现，用于重试时更新请求头）
            getLatestToken: function () {
                return localStorage.getItem('token') || null;
            }
        };
        // 私有状态（完整队列逻辑）
        this.isRefreshingToken = false;
        // 队列元素类型：保存重试请求的resolve/reject函数
        this.pendingRequests = [];
        this.requestServer = requestServer;
        this.config.isTokenExpired = config.isTokenExpired || this.config.isTokenExpired;
        this.config.refreshToken = config.refreshToken || this.config.refreshToken;
        this.config.useRefreshToken = !!config.useRefreshToken;
    }
    TokenRequestHandler.prototype.getAxiosError = function (response) {
        return new AxiosError('刷新令牌失败，请重新登录', 'REFRESH_TOKEN_FAILED', undefined, undefined, response);
    };
    /**
     * 处理请求错误（核心入口，保证返回值链路完整）
     * @param error Axios错误对象
     * @returns Promise<AxiosResponse> 最终的请求结果（重试成功/失败）//,showErrorWhenNotTokenExpired:undefined|(()=>void)=undefined
     */
    TokenRequestHandler.prototype.handleRequestError = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var response, originalRequest, isTokenExpired;
            var _this = this;
            return __generator(this, function (_a) {
                // 1. 基础校验：无响应/未启用刷新令牌 → 直接抛出（返回值链路1）
                if (!error.response || !this.config.useRefreshToken) {
                    //showErrorWhenNotTokenExpired&&showErrorWhenNotTokenExpired();
                    return [2 /*return*/, Promise.reject(error)];
                }
                response = error.response;
                originalRequest = error.config;
                isTokenExpired = this.config.isTokenExpired(response);
                if (!isTokenExpired) {
                    //showErrorWhenNotTokenExpired&&showErrorWhenNotTokenExpired();
                    //return // Promise.reject(error);
                    return [2 /*return*/, Promise.reject(error)];
                }
                // 3. 防止循环重试 → 已重试则抛出（返回值链路3）
                if (originalRequest._isRetryRequest) {
                    return [2 /*return*/, Promise.reject()]; //返回空参说明不需要错误提示
                }
                originalRequest._isRetryRequest = true;
                // 4. 核心逻辑：处理令牌过期 + 并发队列（保证返回值链路完整）
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // 4.1 将当前请求的resolve/reject存入队列（关键：绑定返回值）
                        _this.pendingRequests.push({ resolve: resolve, reject: reject, config: originalRequest });
                        // 4.2 未在刷新令牌 → 执行刷新逻辑（仅第一个请求触发）
                        if (!_this.isRefreshingToken) {
                            // 关键：await 刷新逻辑，确保异常能被捕获并传递给队列
                            _this.refreshTokenAndRetry().catch(function (refreshErr) {
                                var reason = _this.getAxiosError(refreshErr);
                                // 刷新令牌本身失败 → 拒绝所有队列请求
                                _this.pendingRequests.forEach(function (_a) {
                                    var reject = _a.reject;
                                    reject(reason);
                                });
                                reject(reason);
                            }).finally(function () {
                                // 清空队列 + 释放锁
                                _this.pendingRequests = [];
                                _this.isRefreshingToken = false;
                            });
                        }
                    })];
            });
        });
    };
    /**
     * 内部方法：刷新令牌并重试队列中的请求
     * @private
     */
    TokenRequestHandler.prototype.refreshTokenAndRetry = function () {
        return __awaiter(this, void 0, void 0, function () {
            var latestToken;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.isRefreshingToken = true;
                        return [4 /*yield*/, this.config.refreshToken()];
                    case 1:
                        latestToken = _a.sent();
                        //const latestToken = this.config.getLatestToken();
                        // 2. 刷新成功：更新请求头 + 重试所有等待的请求
                        this.pendingRequests.forEach(function (_a) {
                            var resolve = _a.resolve, reject = _a.reject, config = _a.config;
                            // 2.1 更新请求头的token（关键：重试时用新token）
                            if (latestToken && config.headers) {
                                config.headers.Authorization = "Bearer ".concat(latestToken);
                            }
                            // 2.2 重试请求并解析结果
                            _this.requestServer.request(config)
                                .then(function (response) { return resolve(response); })
                                .catch(function (error) { return reject(error); });
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    return TokenRequestHandler;
}());
export default TokenRequestHandler;
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
