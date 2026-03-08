var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    function TokenRequestHandler(config) {
        var _this = this;
        // 配置项（带完整类型）
        this.config = {
            useRefreshToken: false,
            // 判断令牌过期（入参为Axios响应，返回布尔值）
            isTokenExpired: function (response) {
                var status = response.status, data = response.data;
                var errorMsg = ((data === null || data === void 0 ? void 0 : data.msg) || (data === null || data === void 0 ? void 0 : data.message) || '').toLowerCase();
                return [401, 403].includes(status) &&
                    (errorMsg.includes('令牌过期') || errorMsg.includes('token expired'));
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
        this.config.getLatestToken = config.getLatestToken || this.config.getLatestToken;
        this.config.isTokenExpired = config.isTokenExpired || this.config.isTokenExpired;
        this.config.refreshToken = config.refreshToken || this.config.refreshToken;
        this.config.getLatestToken = config.getLatestToken || this.config.getLatestToken;
        this.config.useRefreshToken = !!config.useRefreshToken;
    }
    /**
     * 处理请求错误（核心入口）
     */
    TokenRequestHandler.prototype.handleRequestError1 = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var response, originalRequest, isTokenExpired;
            var _this = this;
            return __generator(this, function (_a) {
                // 1. 基础校验：无响应/未启用刷新令牌 → 直接抛出
                if (!error.response || !this.config.useRefreshToken) {
                    return [2 /*return*/, Promise.reject(error)];
                }
                response = error.response;
                originalRequest = error.config;
                try {
                    isTokenExpired = this.config.isTokenExpired(response);
                    if (!isTokenExpired) {
                        return [2 /*return*/, Promise.reject(error)];
                    }
                    // 3. 防止循环重试：已标记过重试则直接失败
                    if (originalRequest._isRetryRequest) {
                        return [2 /*return*/, Promise.reject(error)];
                    }
                    originalRequest._isRetryRequest = true;
                    // 4. 核心逻辑：处理令牌过期 + 并发请求队列
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            // 4.1 将当前请求加入等待队列
                            _this.pendingRequests.push({ resolve: resolve, reject: reject, config: originalRequest });
                            // 4.2 未在刷新令牌 → 执行刷新逻辑
                            if (!_this.isRefreshingToken) {
                                _this.refreshTokenAndRetry();
                            }
                        })];
                }
                catch (innerError) {
                    console.error('令牌过期处理失败：', innerError);
                    return [2 /*return*/, Promise.reject(__assign(__assign({}, error), { innerError: innerError }))];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
       * 处理请求错误（核心入口，保证返回值链路完整）
       * @param error Axios错误对象
       * @returns Promise<AxiosResponse> 最终的请求结果（重试成功/失败）
       */
    TokenRequestHandler.prototype.handleRequestError = function (error_1) {
        return __awaiter(this, arguments, void 0, function (error, showErrorWhenNotTokenExpired) {
            var response, originalRequest, isTokenExpired;
            var _this = this;
            if (showErrorWhenNotTokenExpired === void 0) { showErrorWhenNotTokenExpired = undefined; }
            return __generator(this, function (_a) {
                // 1. 基础校验：无响应/未启用刷新令牌 → 直接抛出（返回值链路1）
                if (!error.response || !this.config.useRefreshToken) {
                    showErrorWhenNotTokenExpired && showErrorWhenNotTokenExpired();
                    return [2 /*return*/, Promise.reject(error)];
                }
                response = error.response;
                originalRequest = error.config;
                isTokenExpired = this.config.isTokenExpired(response);
                if (!isTokenExpired) {
                    showErrorWhenNotTokenExpired && showErrorWhenNotTokenExpired();
                    return [2 /*return*/, Promise.reject(error)];
                }
                // 3. 防止循环重试 → 已重试则抛出（返回值链路3）
                if (originalRequest._isRetryRequest) {
                    return [2 /*return*/, Promise.reject(error)];
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
                                // 刷新令牌本身失败 → 拒绝所有队列请求
                                _this.pendingRequests.forEach(function (_a) {
                                    var reject = _a.reject;
                                    reject(new AxiosError('刷新令牌失败，请重新登录', 'REFRESH_TOKEN_FAILED', undefined, undefined, refreshErr === null || refreshErr === void 0 ? void 0 : refreshErr.response));
                                });
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
            var latestToken_1, refreshError_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.isRefreshingToken = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        // 1. 执行刷新令牌（使用者实现的逻辑）
                        return [4 /*yield*/, this.config.refreshToken()];
                    case 2:
                        // 1. 执行刷新令牌（使用者实现的逻辑）
                        _a.sent();
                        latestToken_1 = this.config.getLatestToken();
                        // 2. 刷新成功：更新请求头 + 重试所有等待的请求
                        this.pendingRequests.forEach(function (_a) {
                            var resolve = _a.resolve, reject = _a.reject, config = _a.config;
                            // 2.1 更新请求头的token（关键：重试时用新token）
                            if (latestToken_1 && config.headers) {
                                config.headers.Authorization = "Bearer ".concat(latestToken_1);
                            }
                            // 2.2 重试请求并解析结果
                            axios(config)
                                .then(function (res) { return resolve(res); })
                                .catch(function (err) { return reject(err); });
                        });
                        return [3 /*break*/, 5];
                    case 3:
                        refreshError_1 = _a.sent();
                        // 3. 刷新失败：拒绝所有等待的请求
                        this.pendingRequests.forEach(function () {
                            var isAxiosError = function (err) {
                                return err instanceof AxiosError;
                            };
                            var errorResponse = isAxiosError(refreshError_1) ? refreshError_1.response : undefined;
                            // 3. 拒绝队列请求：传入标准化的AxiosError
                            _this.pendingRequests.forEach(function (_a) {
                                var reject = _a.reject;
                                reject(new AxiosError('刷新令牌失败，请重新登录', 'REFRESH_TOKEN_FAILED', undefined, undefined, errorResponse));
                            });
                        });
                        console.error('刷新令牌失败：', refreshError_1);
                        return [3 /*break*/, 5];
                    case 4:
                        // 4. 重置状态：清空队列 + 释放锁
                        this.pendingRequests = [];
                        this.isRefreshingToken = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
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
