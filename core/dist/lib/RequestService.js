var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import axios, { AxiosError } from 'axios';
import TokenRequestHandler from './TokenRequestHandler';
import UploadService from './UploadService';
var HibackError = /** @class */ (function (_super) {
    __extends(HibackError, _super);
    function HibackError(m) {
        var _this = _super.call(this, m) || this;
        _this.name = "HibackError";
        return _this;
    }
    return HibackError;
}(Error));
export { HibackError };
var isProduction = process.env['NODE_ENV'] === 'production';
/**
 * @description 请求服务
 * @author kongjing
 * @date 2026.03.13
*/
var RequestService = /** @class */ (function () {
    function RequestService(config) {
        var _this = this;
        this.KCONFIG = {
            baseUrl: 'https://j.jq123.net',
            refreshTokenApi: 'system/user/refreshToken',
            signOutWhen401And403Time: 500,
            useRefreshToken: false,
            fileUpload: {
                api: 'https://j.jq123.net/file/uploadBig',
                chunkSize: 1024 * 1024 * 1,
                batchSize: 12,
                maxRetries: 3,
                retryDelay: 1000,
                uploadNotify: function (_) {
                    console.debug("尚未实现kconfig.api.fileUpload.uploadNotify");
                }
            },
            headerHook: function () {
                console.debug("尚未实现kconfig.api.headerHook");
            },
            signOut: function () {
                throw new HibackError("请实现此Hook->sinOut");
            },
            token: function () {
                return '---token---';
            },
            refreshToken: function () {
                return '---refreshToken---';
            },
            saveToken: function () {
                throw new HibackError("请实现此Hook->saveToken");
            },
            uploadNotify: function (e) {
                console.info('kconfig.uploadHook.uploadNotify->e:%o', e);
            },
            messageBox: function () {
                throw new HibackError("kconfig.ts尚未实现:messageBox(type:'error'|'success'|'warning'|'info',message:string)");
            },
            merge: function (options) {
                for (var key in options) {
                    this[key] = options[key];
                }
            }
        };
        //处理UI级消息相应
        this.messagePop = function (response, defaultMessage) {
            if (defaultMessage === void 0) { defaultMessage = ''; }
            _this.config.messageBox({ status: response.status, code: response.data.code, message: response.data.message || defaultMessage });
        };
        // 错误处理
        this.showError = function (error) {
            var _a, _b, _c, _d, _e, _f;
            var _g = error.config || {}, configBaseURL = _g.baseURL, configURL = _g.url;
            // 1. 拼接 URL 并校验合法性
            var fullUrl = _this.normalizeUrl(configBaseURL, configURL);
            // 2. 优先处理非法 URL 场景
            if (!fullUrl || !_this.isUrlValid(fullUrl)) {
                var fallbackMessage = isProduction
                    ? '请求地址异常，请稍后重试'
                    : "\u65E0\u6548\u7684\u8BF7\u6C42\u5730\u5740\uFF1AbaseURL=\"".concat((_a = error.config) === null || _a === void 0 ? void 0 : _a.baseURL, "\", url=\"").concat((_b = error.config) === null || _b === void 0 ? void 0 : _b.url, "\"\uFF0C\u62FC\u63A5\u540E\uFF1A\"").concat(fullUrl, "\"");
                _this.messagePop({
                    status: error.status || 500,
                    data: { code: 500, message: fallbackMessage, data: undefined }
                });
            }
            try {
                if (error instanceof AxiosError) {
                    if (_this.isBizJsonResult((_c = error.response) === null || _c === void 0 ? void 0 : _c.data)) {
                        _this.messagePop(error.response, "\u670D\u52A1\u5668\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
                    }
                    else {
                        var urlObj = new URL(fullUrl);
                        var host = urlObj.hostname;
                        var port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);
                        var baseMessage = '';
                        var userMessage = '';
                        // ========== 1. 端口程序未启动（核心场景） ==========
                        if (error.code === 'ECONNREFUSED') {
                            baseMessage = '服务暂时不可用，请稍后重试';
                            if (!isProduction) {
                                // 精准提示：服务器启动但端口程序关闭
                                userMessage = "\u670D\u52A1\u5668 ".concat(host, " \u5DF2\u542F\u52A8\uFF0C\u4F46 ").concat(port, " \u7AEF\u53E3\u7684\u670D\u52A1\u672A\u8FD0\u884C\uFF01\u8BF7\u68C0\u67E5\u8BE5\u7AEF\u53E3\u7684\u7A0B\u5E8F\u662F\u5426\u542F\u52A8\u3002");
                            }
                        }
                        // ========== 2. 服务器连接超时/不可达 ==========
                        else if (['ETIMEDOUT', 'ENETUNREACH', 'ECONNABORTED'].includes(error.code || '')) {
                            baseMessage = '网络连接异常，请检查网络后重试';
                            if (!isProduction) {
                                userMessage = "\u65E0\u6CD5\u8FDE\u63A5\u5230\u670D\u52A1\u5668 ".concat(host, "\uFF0C\u9519\u8BEF\u7801\uFF1A").concat(error.code, "\uFF0C\u53EF\u80FD\u662F\u670D\u52A1\u5668\u6574\u673A\u672A\u542F\u52A8\u6216\u7F51\u7EDC\u4E0D\u901A\u3002");
                            }
                        }
                        // ========== 3. 响应格式异常（ERR_BAD_RESPONSE） ==========
                        else if (error.code === 'ERR_BAD_RESPONSE') {
                            baseMessage = '服务响应格式异常，请稍后重试';
                            if (!isProduction) {
                                // 仅提示「程序已启动但响应异常」，排除端口未启动的误导
                                userMessage = "\u670D\u52A1\u5668 ".concat(host, ":").concat(port, " \u7A0B\u5E8F\u5DF2\u542F\u52A8\uFF0C\u4F46\u8FD4\u56DE\u975E\u6CD5\u54CD\u5E94\uFF08ERR_BAD_RESPONSE\uFF09\uFF01\u53EF\u80FD\u662F\u54CD\u5E94\u683C\u5F0F\u9519\u8BEF/\u7A7A\u54CD\u5E94\uFF0C\u539F\u59CB\u54CD\u5E94\uFF1A").concat(JSON.stringify(((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) || '空响应'));
                            }
                        }
                        // ========== 4. 服务器内部错误（500） ==========
                        else if (((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) === 500) {
                            baseMessage = '服务器繁忙，请稍后重试';
                            if (!isProduction) {
                                userMessage = "\u670D\u52A1\u5668 ".concat(host, ":").concat(port, " \u7A0B\u5E8F\u5DF2\u542F\u52A8\uFF0C\u4F46\u5904\u7406\u8BF7\u6C42\u65F6\u53D1\u751F\u5185\u90E8\u9519\u8BEF\uFF08500\uFF09\uFF0C\u54CD\u5E94\uFF1A").concat(JSON.stringify(error.response.data));
                            }
                        }
                        // ========== 5. 其他错误 ==========
                        else {
                            var status_1 = ((_f = error.response) === null || _f === void 0 ? void 0 : _f.status) || '未知';
                            baseMessage = "\u8BF7\u6C42\u5931\u8D25\uFF08".concat(status_1, "\uFF09\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
                            if (!isProduction) {
                                userMessage = "\u8BF7\u6C42\u5931\u8D25\uFF0C\u72B6\u6001\u7801\uFF1A".concat(status_1, "\uFF0C\u9519\u8BEF\u7801\uFF1A").concat(error.code, "\uFF0C\u4FE1\u606F\uFF1A").concat(error.message);
                            }
                        }
                        var badMessage = isProduction ? baseMessage : userMessage;
                        var status_2 = error.status || 500;
                        _this.messagePop({ status: status_2, data: { code: status_2, message: badMessage, data: undefined } });
                    }
                    // token过期，清除本地数据，并跳转至登录页面
                    // if (error.status === 403||error.status === 401 || fullUrl.indexOf(this.config.refreshTokenApi)) {
                    //   setTimeout(() => {
                    //     this.config.signOut()
                    //   },this.config.signOutWhen401And403Time||300);
                    // }
                }
                else {
                    _this.messagePop(error, "网络或服务器错误，请稍后重试。");
                }
            }
            catch (urlParseError) {
                // 兜底：极端情况（校验通过但解析失败）
                var fallbackMessage = isProduction
                    ? '请求地址异常，请稍后重试'
                    : "URL \u89E3\u6790\u5931\u8D25\uFF1A".concat(fullUrl, "\uFF0C\u9519\u8BEF\uFF1A").concat(urlParseError.message);
                _this.messagePop({
                    status: error.status || 500,
                    data: { code: 500, message: fallbackMessage, data: undefined }
                });
            }
        };
        //从Http响应中获取业务级响应
        this.defaultResponseAdapter = function (nativeResponse) {
            var response;
            var retResult = nativeResponse.data;
            if (retResult && typeof (retResult.code) !== 'undefined') {
                response = retResult.code === 200
                    ? (retResult.data !== undefined ? retResult.data : true)
                    : (retResult.data !== undefined ? retResult.data : false);
            }
            else {
                response = retResult;
            }
            return response;
        };
        //处理响应入口 
        this.responseProcess = function (response) {
            _this.messagePop(response);
            return new Promise(function (resolve) { return _this.resolveResponse(response, resolve); });
        };
        //从Http相应获取重新包装的响应内容
        this.getAxiosResponse = function (xhr, requestConfig) {
            if (requestConfig === void 0) { requestConfig = {}; }
            return _this.convertXhrToAxiosResponse(xhr, requestConfig);
        };
        /**
         * @description 系统前端开发快速应用接口的能力，并提供标准的接口请求和响应处理
         * @author kongjing
         * @date 2022.10.12
        */
        this.request = function (config, contentType) {
            if (contentType === void 0) { contentType = 'application/json'; }
            if (contentType) {
                config.headers = config.headers || {};
                config.headers['Content-Type'] = contentType;
            }
            return _this.service(config);
        };
        this.config = this.KCONFIG;
        for (var key in config) {
            typeof (config[key]) !== undefined && (this.config[key] = config[key]);
        }
        this.config.responseAdapter = this.config.responseAdapter || this.defaultResponseAdapter;
        this.service = axios.create({ baseURL: this.config.baseUrl, timeout: this.config.timeout });
        this.config.tokenRequestHandler = this.config.tokenRequestHandler || (new TokenRequestHandler(this, {
            useRefreshToken: this.config.useRefreshToken,
            refreshToken: function () { return __awaiter(_this, void 0, void 0, function () {
                var refreshToken, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            refreshToken = this.config.refreshToken();
                            if (!refreshToken)
                                throw new HibackError('无刷新令牌');
                            return [4 /*yield*/, this.request({
                                    url: this.config.refreshTokenApi,
                                    data: { refreshToken: refreshToken },
                                    method: 'post'
                                })];
                        case 1:
                            res = _a.sent();
                            if (!res.token || !res.refreshToken) {
                                throw new HibackError('令牌刷新失败');
                            }
                            this.config.saveToken(res.token, res.refreshToken);
                            return [2 /*return*/, res.token];
                    }
                });
            }); }
        }));
        // 请求拦截器
        this.service.interceptors.request.use(this.defaultInterceptor, function (error) { return Promise.reject(error); });
        // 响应拦截器
        this.service.interceptors.response.use(this.responseProcess, function (error) {
            var _a;
            return (_a = _this.config.tokenRequestHandler) === null || _a === void 0 ? void 0 : _a.handleRequestError(error).catch(function (reason) {
                if (reason) {
                    if ((reason === null || reason === void 0 ? void 0 : reason.code) === '401' || (reason === null || reason === void 0 ? void 0 : reason.code) === 'REFRESH_TOKEN_FAILED') {
                        setTimeout(function () {
                            _this.config.signOut(true);
                        }, _this.config.signOutWhen401And403Time || 300);
                    }
                    else {
                        _this.showError(reason);
                    }
                }
            });
        });
        this.uploadService = new UploadService(this);
    }
    Object.defineProperty(RequestService.prototype, "defaultInterceptor", {
        get: function () {
            var _this = this;
            return function (config) {
                var _a;
                _this.config.headerHook(config.headers);
                config.headers = config.headers || {};
                // JWT鉴权处理
                if ((_a = config.url) === null || _a === void 0 ? void 0 : _a.endsWith(_this.config.refreshTokenApi)) {
                    //如果在刷新令牌时不需要设置jwt头
                    delete config.headers.Authorization;
                }
                else {
                    var token = _this.config.token();
                    config.headers.Authorization = "Bearer ".concat(token);
                }
                if (config != null && config.data && (config.method || 'get').toLowerCase() === "get") {
                    config.params = config.data;
                    delete config.data;
                }
                return config;
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RequestService.prototype, "axiosConfig", {
        get: function () {
            return this.config;
        },
        enumerable: false,
        configurable: true
    });
    RequestService.prototype.isBizJsonResult = function (ajaxResult) {
        return ajaxResult && typeof ajaxResult === 'object' && 'code' in ajaxResult;
    };
    /**
     * 规范化拼接 URL，自动处理重复斜杠问题
     * @param baseURL - 基础地址（如 https://api.example.com/）
     * @param url - 接口路径（如 /user/list）
     * @returns 规范化的完整 URL
     */
    RequestService.prototype.normalizeUrl = function (baseURL, url) {
        // 空值处理
        var normalizedBase = (baseURL === null || baseURL === void 0 ? void 0 : baseURL.trim().replace(/\/+$/, '')) || '';
        var normalizedUrl = (url === null || url === void 0 ? void 0 : url.trim().replace(/^\/+/, '')) || '';
        // 第一步：拼接 Axios 的 baseURL 和接口路径
        var fullUrl = '';
        if (!normalizedBase) {
            fullUrl = normalizedUrl;
        }
        else if (!normalizedUrl) {
            fullUrl = normalizedBase;
        }
        else {
            fullUrl = "".concat(normalizedBase, "/").concat(normalizedUrl);
        }
        // 第二步：处理相对路径（核心优化：读取环境变量，无硬编码）
        if (fullUrl && !fullUrl.startsWith('http') && typeof window !== 'undefined') {
            var origin_1 = window.location.origin; // 自动获取协议+主机+端口，如 http://localhost:8080
            fullUrl = "".concat(origin_1, "/").concat(fullUrl.replace(/^\/+/, ''));
        }
        return fullUrl;
    };
    /**
     * 校验 URL 是否合法
     * @param url - 待校验的 URL 字符串
     * @returns 是否合法
     */
    RequestService.prototype.isUrlValid = function (url) {
        if (!url || url.trim() === '')
            return false;
        try {
            // 尝试构造 URL，能成功则合法
            new URL(url);
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    //处理业务级响应AxiosResponse<TRetData, TRequestData> | PromiseLike<AxiosResponse<TRetData, TRequestData>>
    RequestService.prototype.resolveResponse = function (response, resolve) {
        resolve(this.config.responseAdapter(response));
    };
    /**
     * 将 XHR 响应转换为 AxiosResponse 实例
     * @param xhr XHR 实例
     * @param requestConfig 请求配置（构造 config 字段）
     * @returns 符合 AxiosResponse 规范的实例
     */
    RequestService.prototype.convertXhrToAxiosResponse = function (xhr, requestConfig) {
        if (requestConfig === void 0) { requestConfig = {}; }
        // 1. 确定 data 字段（根据 responseType 适配）
        var data;
        var responseType = requestConfig.responseType || xhr.responseType;
        try {
            if (responseType === 'json' && xhr.responseText) {
                data = JSON.parse(xhr.responseText);
            }
            else if (responseType === 'text' || responseType === '') {
                data = xhr.responseText;
            }
            else {
                // blob/arraybuffer 等二进制类型
                data = xhr.response;
            }
        }
        catch (e) {
            // 解析失败时 data 为原始响应文本
            data = xhr.responseText;
            console.warn('解析 XHR 响应数据失败：', e);
        }
        // 2. 构建完整的 AxiosResponse 实例
        var axiosResponse = {
            data: data,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: this.parseResponseHeaders(xhr.getAllResponseHeaders()),
            config: __assign({ 
                // 补全默认请求配置
                url: requestConfig.url || xhr.responseURL, method: requestConfig.method || 'GET', headers: requestConfig.headers, data: requestConfig.data, responseType: responseType || 'text' }, requestConfig),
            request: xhr // 关联原始 XHR 实例
        };
        return axiosResponse;
    };
    RequestService.prototype.parseResponseHeaders = function (headersStr) {
        var headers = {};
        if (!headersStr || typeof headersStr !== 'string')
            return headers;
        // 分割响应头并解析为键值对（过滤空行）
        headersStr.split('\r\n').forEach(function (line) {
            // 去除整行首尾空白，过滤空行
            var trimmedLine = line.trim();
            if (!trimmedLine)
                return;
            // 找到第一个冒号的位置（避免值中包含冒号导致分割错误）
            var colonIndex = trimmedLine.indexOf(':');
            if (colonIndex === -1)
                return; // 无效的头行（无冒号）
            // 分割键和值，分别去除首尾空格
            var key = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
            var value = trimmedLine.substring(colonIndex + 1).trim();
            if (!key)
                return; // 空键跳过
            // 处理多值头：始终保持数组类型（符合 Axios 规范）
            if (headers[key]) {
                // 如果已有值，确保是数组并追加
                headers[key] = Array.isArray(headers[key])
                    ? __spreadArray(__spreadArray([], headers[key], true), [value], false) : [headers[key], value];
            }
            else {
                // 首次赋值：单值也建议用数组（符合 Axios 对多值头的处理方式）
                // 若想和 Axios 完全一致，单值可直接存字符串，多值存数组
                headers[key] = value;
                // 可选：严格按 Axios 规范（单值字符串，多值数组）
                // headers[key] = value;
            }
        });
        return headers;
    };
    //上传文件
    RequestService.prototype.uploadFile = function (file, opts) {
        return this.uploadService.upload(file, opts);
    };
    Object.defineProperty(RequestService.prototype, "httpRequest", {
        //组件使用
        get: function () {
            return this.uploadService.httpRequest;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @description 适配相应为标准处理
     * @author kongjing
     * @date 2026.03.11
     */ //xhr:XMLHttpRequest TRetData=any,TRequestData=any
    RequestService.prototype.responseAdapter = function (nativeResponse) {
        return this.config.responseAdapter(nativeResponse);
    };
    return RequestService;
}());
export default RequestService;
