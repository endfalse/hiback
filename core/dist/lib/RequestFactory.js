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
import axios, { AxiosError } from 'axios';
import { AjaxResultCode } from '../enums/system';
import TokenRequestHandler from './TokenRequestHandler';
var isProduction = process.env['NODE_ENV'] === 'production';
var RequestFactory = /** @class */ (function () {
    function RequestFactory(config) {
        var _this = this;
        this.KCONFIG = {
            baseUrl: 'https://j.jq123.net',
            timeout: 3000,
            bigUploadApi: 'https://j.jq123.net/file/uploadBig',
            normalUploadApi: 'https://j.jq123.net/file',
            refreshTokenApi: 'system/user/refreshToken',
            signOutWhen401And403Time: 500,
            useRefreshToken: false,
            // nextDo:()=>{
            //     return false
            // },
            headerHook: function () {
                console.debug("尚未实现kconfig.api.headerHook");
            },
            signOut: function () {
                throw new Error("请实现此Hook->sinOut");
            },
            token: function () {
                return '---token---';
            },
            refreshToken: function () {
                return '---refreshToken---';
            },
            saveToken: function () {
                throw new Error("请实现此Hook->saveToken");
            },
            uploadNotify: function (e) {
                console.info('kconfig.uploadHook.uploadNotify->e:%o', e);
            },
            messageBox: function () {
                throw new Error("kconfig.ts尚未实现:messageBox(type:'error'|'success'|'warning'|'info',message:string)");
            },
            chunkSize: 1024 * 1024 * 1,
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
            if (error instanceof AxiosError) {
                if (_this.isBizJsonResult((_a = error.response) === null || _a === void 0 ? void 0 : _a.data)) {
                    _this.messagePop(error.response, "\u670D\u52A1\u5668\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
                }
                else {
                    var urlObj = new URL(_this.normalizeUrl((_b = error.config) === null || _b === void 0 ? void 0 : _b.baseURL, (_c = error.config) === null || _c === void 0 ? void 0 : _c.baseURL));
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
                    _this.messagePop({
                        status: error.status || 500,
                        data: { code: 500, message: badMessage, data: undefined }
                    });
                }
                // token过期，清除本地数据，并跳转至登录页面
                if (error.status === 403 || error.status === 401) {
                    setTimeout(function () {
                        _this.config.signOut();
                    }, _this.config.signOutWhen401And403Time || 300);
                }
            }
            else {
                _this.messagePop(error, "网络或服务器错误，请稍后重试。");
            }
        };
        //获取响应体数据
        this.getBody = function (xhr) {
            var text = xhr.responseText || xhr.response;
            if (!text) {
                return text;
            }
            try {
                return JSON.parse(text);
            }
            catch (_a) {
                return text;
            }
        };
        //从Http响应中获取业务级响应
        this.defaultResponseAdapter = function (nativeResponse) {
            // ddd
            // if(nativeResponse.data.feedback){
            //   return nativeResponse.data
            // }
            // if (typeof nativeResponse.data === "undefined") {
            //   nativeResponse.data = {};
            // }
            var response;
            var retResult = nativeResponse.data;
            if (retResult && typeof (retResult.code) !== 'undefined') {
                response = retResult.code === AjaxResultCode.Success
                    ? (retResult.data !== undefined ? retResult.data : true)
                    : (retResult.data !== undefined ? retResult.data : false);
            }
            else {
                response = retResult;
            }
            return response;
        };
        // //-Old
        // private resetRequests(loginOut:boolean=false,reason:any|undefined=undefined){
        //       this.requests.listing=[],
        //       this.requests.isRefreshing =false,
        //       this.requests.retry=0
        //       this.requests.newToken=''
        //       if(loginOut)
        //       {
        //           this.config.signOut()
        //       }
        //       if(reason)
        //       {
        //           Promise.reject(reason)
        //       }
        // }
        // //-Old
        // private refreshToken = ()=>{
        //     if(this.requests.retry>0){
        //         throw new Error('refresh token is invalid')
        //     }
        //     return this.request<{token:string,refreshToken:string}>({
        //       url: this.config.refreshTokenApi,
        //       method: 'post',
        //       data:{refreshToken:this.config.refreshToken()},
        //       headers:{'Content-Type':'application/x-www-form-urlencoded'},
        //     })
        // }
        // //处理令牌过期问题-Old
        // private processInvalidToken=(response: AxiosResponse<AjaxResult<TResponseCode>>)=>{
        //   if(!this.requests.isRefreshing)
        //   {
        //     this.requests.isRefreshing=true
        //     return new Promise(resolve=>{
        //       this.refreshToken().then(async tokens=>{
        //         const {token,refreshToken} = tokens
        //           if (token&&refreshToken) {
        //             //保存新的令牌
        //             this.config.saveToken(token,refreshToken)
        //             this.requests.newToken = token
        //             //获取上次的请求重新发送并获取结果
        //             const newret =  await this.request(response.config)
        //             //处理token过期时请求需要的响应
        //             resolve(newret)
        //             //检查过期后同时发送的其他请求，并根据新的token重新发送请求
        //             this.requests.listing.forEach((cb) => cb(token))
        //             //清除请求队列
        //             this.resetRequests()
        //           }
        //           else {
        //             throw new Error('refresh token is invalid')
        //           }
        //       }).catch(reason=>{
        //         this.resetRequests(true,reason)
        //       })
        //     }).finally(()=>{
        //       this.requests.isRefreshing=false
        //     }) 
        //   }
        //   return new Promise<any>(_=>{
        //     this.requests.listing.push(_=>{
        //       this.request(response.config)
        //     })
        //   })
        // } 
        //处理响应入口 
        this.responseProcess = function (response) {
            //const {code:bizCode} = response.data
            //兼容旧版本无权限情况//
            // if(bizCode===AjaxResultCode.InvalidToken){
            //   return this.processInvalidToken(response)
            // }
            _this.messagePop(response);
            return new Promise(function (resolve) { return _this.resolveResponse(response, resolve); });
        };
        //从Http相应获取重新包装的响应内容
        this.getAxiosResponse = function (xhr, config) {
            return {
                data: _this.getBody(xhr),
                status: xhr.status,
                statusText: xhr.statusText,
                headers: config.headers,
                config: config,
                request: xhr,
            };
        };
        /**
         * @description 系统前端开发快速应用接口的能力，并提供标准的接口请求和响应处理
         * @author kongjing
         * @date 2022.10.12
         */
        this.request = function (config) {
            return _this.service(config);
        };
        this.config = this.KCONFIG;
        for (var key in config) {
            config[key] && (this.config[key] = config[key]);
        }
        this.config.responseAdapter = this.config.responseAdapter || this.defaultResponseAdapter;
        this.service = axios.create({ baseURL: this.config.baseUrl, timeout: this.config.timeout });
        this.config.tokenRequestHandler = new TokenRequestHandler({
            useRefreshToken: this.config.useRefreshToken,
            isTokenExpired: function (response) {
                var _a;
                return response.status === 401 && ((_a = response.data) === null || _a === void 0 ? void 0 : _a.code) === 10001;
            },
            refreshToken: function () { return __awaiter(_this, void 0, void 0, function () {
                var refreshToken, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            refreshToken = this.config.refreshToken();
                            if (!refreshToken)
                                throw new Error('无刷新令牌');
                            return [4 /*yield*/, this.service.post(this.config.refreshTokenApi, { refreshToken: refreshToken })];
                        case 1:
                            res = _a.sent();
                            if (res.data.code !== 200)
                                throw new Error(res.data.msg || '刷新失败');
                            this.config.saveToken(res.data.data.token, res.data.data.refreshToken);
                            return [2 /*return*/];
                    }
                });
            }); },
            getLatestToken: function () {
                return _this.config.token();
            }
        });
        // 请求拦截器
        this.service.interceptors.request.use(this.defaultInterceptor, function (error) { return Promise.reject(error); });
        // 响应拦截器
        this.service.interceptors.response.use(this.responseProcess, function (error) {
            var _a;
            // this.requests.isRefreshing=false
            // if(this.config.useRefreshToken&&this.config.nextDo(error.response)){
            //   //无权限情况
            //   return this.processInvalidToken(error.response!)
            // }
            return (_a = _this.config.tokenRequestHandler) === null || _a === void 0 ? void 0 : _a.handleRequestError(error, function () {
                _this.showError(error);
            });
        });
    }
    Object.defineProperty(RequestFactory.prototype, "defaultInterceptor", {
        //-Old
        // private requests= {
        //   isRefreshing:false,
        //   listing:[] as ((token:string)=>void)[],
        //   retry:0,
        //   newToken:''
        // }
        get: function () {
            var _this = this;
            return function (config) {
                var _a;
                _this.config.headerHook(config.headers);
                config.headers = config.headers || {};
                // JWT鉴权处理
                if ((_a = config.url) === null || _a === void 0 ? void 0 : _a.endsWith(_this.config.refreshTokenApi)) {
                    // if(this.requests.newToken){
                    //   config.headers.Authorization=`Bearer ${this.requests.newToken}`
                    // }
                    // else
                    // {
                    //   //如果在刷新令牌时不需要设置jwt头
                    //   delete config.headers.Authorization
                    // }
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
    Object.defineProperty(RequestFactory.prototype, "axiosConfig", {
        get: function () {
            return this.config;
        },
        enumerable: false,
        configurable: true
    });
    RequestFactory.prototype.isBizJsonResult = function (ajaxResult) {
        return ajaxResult && typeof ajaxResult === 'object' && 'code' in ajaxResult;
    };
    /**
     * 规范化拼接 URL，自动处理重复斜杠问题
     * @param baseURL - 基础地址（如 https://api.example.com/）
     * @param url - 接口路径（如 /user/list）
     * @returns 规范化的完整 URL
     */
    RequestFactory.prototype.normalizeUrl = function (baseURL, url) {
        // 去除首尾空白和多余的 /
        var normalizedBase = (baseURL === null || baseURL === void 0 ? void 0 : baseURL.trim().replace(/\/+$/, '')) || '';
        var normalizedUrl = (url === null || url === void 0 ? void 0 : url.trim().replace(/^\/+/, '')) || '';
        // 拼接逻辑：
        // 1. 两者都为空 → 返回空
        // 2. 只有一个有值 → 直接返回该值
        // 3. 两者都有值 → 中间加一个 / 拼接
        if (!normalizedBase)
            return normalizedUrl;
        if (!normalizedUrl)
            return normalizedBase;
        return "".concat(normalizedBase, "/").concat(normalizedUrl);
    };
    //处理业务级响应AxiosResponse<TRetData, TRequestData> | PromiseLike<AxiosResponse<TRetData, TRequestData>>
    RequestFactory.prototype.resolveResponse = function (response, resolve) {
        resolve(this.config.responseAdapter(response));
    };
    Object.defineProperty(RequestFactory.prototype, "bigUploadApi", {
        get: function () {
            return this.config.bigUploadApi;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RequestFactory.prototype, "normalUploadApi", {
        get: function () {
            return this.config.normalUploadApi;
        },
        enumerable: false,
        configurable: true
    });
    return RequestFactory;
}());
export default RequestFactory;
