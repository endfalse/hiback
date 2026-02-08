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
var RequestFactory = /** @class */ (function () {
    function RequestFactory(config) {
        var _this = this;
        this.requests = {
            isRefreshing: false,
            listing: [],
            retry: 0,
            newToken: ''
        };
        this.KCONFIG = {
            baseUrl: 'https://j.jq123.net',
            timeout: 3000,
            bigUploadApi: 'https://j.jq123.net/file/uploadBig',
            normalUploadApi: 'https://j.jq123.net/file',
            refreshTokenApi: 'system/user/refreshToken',
            signOutWhen401And403Time: 500,
            useRefreshToken: false,
            nextDo: function () {
                return false;
            },
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
        this.refreshToken = function () {
            if (_this.requests.retry > 0) {
                throw new Error('refresh token is invalid');
            }
            return _this.request({
                url: _this.config.refreshTokenApi,
                method: 'post',
                data: { refreshToken: _this.config.refreshToken() },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
        };
        //处理UI级消息相应
        this.messagePop = function (response) {
            // const message = response.data.message
            // if(response.status===200){
            //   message&&this.config.messageBox('success',message)
            // }
            // else{
            //   this.config.messageBox('error',message || '服务异常')
            // }
            _this.config.messageBox({ status: response.status, code: response.data.code, message: response.data.message });
        };
        // 错误处理
        this.showError = function (error) {
            var _a;
            if (error instanceof AxiosError) {
                if (_this.isBizJsonResult((_a = error.response) === null || _a === void 0 ? void 0 : _a.data)) {
                    _this.messagePop(error.response);
                }
                else {
                    var badMessage = error.message || error;
                    _this.messagePop({
                        status: error.status || 500,
                        data: { code: 500, message: badMessage || '服务异常', data: undefined }
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
                _this.messagePop(error);
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
        this.pickBizResponse = function (nativeResponse) {
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
        //处理令牌过期问题
        this.processInvalidToken = function (response) {
            if (!_this.requests.isRefreshing) {
                _this.requests.isRefreshing = true;
                return new Promise(function (resolve) {
                    _this.refreshToken().then(function (tokens) { return __awaiter(_this, void 0, void 0, function () {
                        var token, refreshToken, newret;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    token = tokens.token, refreshToken = tokens.refreshToken;
                                    if (!(token && refreshToken)) return [3 /*break*/, 2];
                                    //保存新的令牌
                                    this.config.saveToken(token, refreshToken);
                                    this.requests.newToken = token;
                                    return [4 /*yield*/, this.request(response.config)
                                        //处理token过期时请求需要的响应
                                    ];
                                case 1:
                                    newret = _a.sent();
                                    //处理token过期时请求需要的响应
                                    resolve(newret);
                                    //检查过期后同时发送的其他请求，并根据新的token重新发送请求
                                    this.requests.listing.forEach(function (cb) { return cb(token); });
                                    //清除请求队列
                                    this.resetRequests();
                                    return [3 /*break*/, 3];
                                case 2: throw new Error('refresh token is invalid');
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }).catch(function (reason) {
                        _this.resetRequests(true, reason);
                    });
                }).finally(function () {
                    _this.requests.isRefreshing = false;
                });
            }
            return new Promise(function (_) {
                _this.requests.listing.push(function (_) {
                    _this.request(response.config);
                });
            });
        };
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
        this.config.unPackResponse = this.config.unPackResponse || this.pickBizResponse;
        this.service = axios.create({ baseURL: this.config.baseUrl, timeout: this.config.timeout });
        // 请求拦截器
        this.service.interceptors.request.use(this.defaultInterceptor, function (error) { return Promise.reject(error); });
        // 响应拦截器
        this.service.interceptors.response.use(this.responseProcess, function (error) {
            var _a, _b;
            _this.requests.isRefreshing = false;
            if (_this.config.useRefreshToken && _this.config.nextDo((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.code)) {
                //无权限情况
                return _this.processInvalidToken(error.response);
            }
            // if(this.config.useRefreshToken&&error.response?.status === 401
            //   &&(error.response.data?.code as AjaxResultCode)===AjaxResultCode.InvalidToken){
            //   //无权限情况
            //   return this.processInvalidToken(error.response)
            // }
            _this.showError(error);
            return Promise.reject(error);
        });
    }
    Object.defineProperty(RequestFactory.prototype, "defaultInterceptor", {
        get: function () {
            var _this = this;
            return function (config) {
                _this.config.headerHook(config.headers);
                config.headers = config.headers || {};
                // JWT鉴权处理
                if (_this.requests.isRefreshing) {
                    if (_this.requests.newToken) {
                        config.headers.Authorization = "Bearer ".concat(_this.requests.newToken);
                    }
                    else {
                        //如果在刷新令牌时不需要设置jwt头
                        delete config.headers.Authorization;
                    }
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
    RequestFactory.prototype.resetRequests = function (loginOut, reason) {
        if (loginOut === void 0) { loginOut = false; }
        if (reason === void 0) { reason = undefined; }
        this.requests.listing = [],
            this.requests.isRefreshing = false,
            this.requests.retry = 0;
        this.requests.newToken = '';
        if (loginOut) {
            this.config.signOut();
        }
        if (reason) {
            Promise.reject(reason);
        }
    };
    RequestFactory.prototype.isBizJsonResult = function (ajaxResult) {
        return ajaxResult && typeof ajaxResult === 'object' && 'code' in ajaxResult;
    };
    //处理业务级响应AxiosResponse<TRetData, TRequestData> | PromiseLike<AxiosResponse<TRetData, TRequestData>>
    RequestFactory.prototype.resolveResponse = function (response, resolve) {
        resolve(this.config.unPackResponse(response));
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
