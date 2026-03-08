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
import { AjaxResultCode } from "../enums/system";
import RequestFactory from "./RequestFactory";
import { getFileMd5 } from "../utils/index";
import kconfig from '../kconfig';
import { v4 as uuidv4 } from 'uuid';
var HibackError = /** @class */ (function (_super) {
    __extends(HibackError, _super);
    function HibackError(m) {
        var _this = _super.call(this, m) || this;
        _this.name = "HibackError";
        return _this;
    }
    return HibackError;
}(Error));
var UploadRequestFactory = /** @class */ (function () {
    function UploadRequestFactory(config) {
        var _this = this;
        //默认文件分片上传大小
        this.chunkSize = 1024 * 1024 * 1;
        this.create = function (option) {
            return _this.httpRequest(option);
        };
        for (var key in kconfig) {
            if (config[key] === undefined) {
                config[key] = kconfig[key];
            }
        }
        this.uploadNotify = kconfig.uploadNotify;
        this.chunkSize = kconfig.chunkSize;
        this.request = new RequestFactory(config);
    }
    UploadRequestFactory.prototype.getError = function (action, option, xhr) {
        var msg;
        if (xhr.response) {
            msg = "".concat(xhr.response.error || xhr.response);
        }
        else if (xhr.responseText) {
            msg = "".concat(xhr.responseText);
        }
        else {
            msg = "fail to ".concat(option.method, " ").concat(action, " ").concat(xhr.status);
        }
        return { message: msg, status: xhr.status, method: option.method, url: action };
    };
    UploadRequestFactory.prototype.isNil = function (value) {
        return value === null || value === undefined;
    };
    //文件切片
    UploadRequestFactory.prototype.sliceFile = function (file, chunkSize) {
        if (chunkSize === void 0) { chunkSize = 1024 * 1024 * 2; }
        var chunks = [];
        var start = 0;
        var end;
        while (start < file.size) {
            end = Math.min(start + chunkSize, file.size);
            chunks.push(file.slice(start, end));
            start = end;
        }
        return chunks;
    };
    //下一步响应处理兼容本框架异步axos封装逻辑
    UploadRequestFactory.prototype.nextProcess = function (xhr_1, option_1) {
        return __awaiter(this, arguments, void 0, function (xhr, option, uploadIfNot) {
            var response, unwapperFun;
            if (uploadIfNot === void 0) { uploadIfNot = undefined; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        response = this.request.getAxiosResponse(xhr, option);
                        unwapperFun = function (nativeResponse) {
                            var ajaxResult = nativeResponse.data;
                            if (typeof (ajaxResult.code) === 'undefined') {
                                throw new Error('返回的数据格式错误');
                            }
                            if (ajaxResult.code == AjaxResultCode.uploadInstant) {
                                option.loaded = option.file.size;
                                option.onProgress({ percent: 100, message: ajaxResult.message });
                                var ret = { code: AjaxResultCode.uploadInstant, data: ajaxResult.data, message: ajaxResult.message };
                                option.onSuccess(ret);
                                return ret;
                            }
                            else if (ajaxResult.code == AjaxResultCode.Success) {
                                option.onProgress({ percent: 100, message: ajaxResult.message });
                                var ret = { code: AjaxResultCode.Success, data: ajaxResult.data, message: ajaxResult.message };
                                option.onSuccess(ret);
                                return ret;
                            }
                            else if (ajaxResult.code == AjaxResultCode.uploadSuccessPart) {
                                uploadIfNot && uploadIfNot(ajaxResult.data ? ajaxResult.data.split('') : []);
                            }
                            else if (ajaxResult.code === AjaxResultCode.unUpload) {
                                uploadIfNot && uploadIfNot([]);
                            }
                            else {
                                throw new Error('返回的数据格式错误');
                            }
                        };
                        this.request.axiosConfig.responseAdapter != this.request.axiosConfig.responseAdapter || unwapperFun;
                        return [4 /*yield*/, this.request.responseProcess(response)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    UploadRequestFactory.prototype.setHeaders = function (xhr, headers, withCredentials) {
        var _a;
        xhr.withCredentials = withCredentials;
        headers = headers || {};
        (_a = this.request.axiosConfig) === null || _a === void 0 ? void 0 : _a.headerHook(headers);
        if (headers instanceof Headers) {
            headers.forEach(function (value, key) { return xhr.setRequestHeader(key, value); });
        }
        else {
            for (var _i = 0, _b = Object.entries(headers); _i < _b.length; _i++) {
                var _c = _b[_i], key = _c[0], value = _c[1];
                if (this.isNil(value))
                    continue;
                xhr.setRequestHeader(key, String(value));
            }
        }
    };
    //执行文件分片上传
    UploadRequestFactory.prototype.uploadCore = function (md5, option, uploadedMap) {
        var _this = this;
        return new Promise(function (resolve) {
            var fileslices = _this.sliceFile(option.file, _this.chunkSize);
            var currentIndex = 0;
            var xhr = new XMLHttpRequest();
            xhr.addEventListener('load', function () { return __awaiter(_this, void 0, void 0, function () {
                var ret;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.nextProcess(xhr, option)];
                        case 1:
                            ret = _a.sent();
                            if (!!ret && (ret.code === AjaxResultCode.uploadInstant || ret.code === AjaxResultCode.Success)) {
                                resolve(true);
                            }
                            currentIndex++;
                            sendAjax();
                            return [2 /*return*/];
                    }
                });
            }); });
            xhr.addEventListener('error', function () {
                return _this.getError(option.action, option, xhr);
            });
            if (option.withCredentials && 'withCredentials' in xhr) {
                xhr.withCredentials = true;
            }
            var lastIndex = uploadedMap.lastIndexOf('1');
            lastIndex = lastIndex == -1 ? fileslices.length - 1 : lastIndex;
            var sendAjax = function () {
                while (currentIndex < fileslices.length) {
                    var blob = fileslices[currentIndex];
                    if (!blob)
                        continue;
                    var unUploaded = uploadedMap[currentIndex] !== '1';
                    if (unUploaded) {
                        var data = new FormData();
                        data.append("totalNumber", fileslices.length.toString());
                        data.append("chunkSize", _this.chunkSize.toString());
                        data.append("chunkNumber", currentIndex.toString());
                        data.append("md5", md5);
                        var file = new File([blob], option.file.name);
                        data.append("file", file, option.file.name);
                        //原始表单额外数据尚未添加
                        if (option.data) {
                            for (var _i = 0, _a = Object.entries(option.data); _i < _a.length; _i++) {
                                var _b = _a[_i], key = _b[0], value = _b[1];
                                if (key === 'md5')
                                    continue;
                                if (Array.isArray(value) && value.length)
                                    data.append(key, value);
                                else
                                    data.append(key, value);
                            }
                        }
                        xhr.open(option.method, option.action, true);
                        _this.setHeaders(xhr, option.headers, option.withCredentials && 'withCredentials' in xhr);
                        xhr.send(data);
                    }
                    option.loaded = (option.loaded || 0) + blob.size;
                    var progressEvt = {};
                    progressEvt.percent = option.file.size > 0 ? (option.loaded / option.file.size) * 100 : 0;
                    progressEvt.percent = progressEvt.percent >= 100 ? 100 : progressEvt.percent;
                    option.onProgress(progressEvt);
                    if (!unUploaded) {
                        currentIndex++;
                        continue;
                    }
                    break;
                }
            };
            sendAjax();
        });
    };
    /**
     * @description 提供文件上传的封装，使用与el-plus和编辑器文件上传等配置
     * @author kongjing
     * @date 2024.11.11
     * */
    UploadRequestFactory.prototype.httpRequest = function (option) {
        return __awaiter(this, void 0, void 0, function () {
            var md5, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (typeof XMLHttpRequest === 'undefined') {
                            throw new HibackError("[XMLHttpRequest is undefined");
                        }
                        option.action = option.action || this.request.bigUploadApi;
                        option.method = option.method || 'POST';
                        option.file.uid = option.file.uid || option.file.name;
                        this.uploadNotify({ uid: option.file.uid, message: '正在计算中...' });
                        if (!(option.MD5Method === 'uuidv4')) return [3 /*break*/, 1];
                        _a = uuidv4();
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, getFileMd5(option.file, function (percent) {
                            _this.uploadNotify({ uid: option.file.uid, message: "\u6B63\u5728\u8BA1\u7B97\u4E2D...".concat(percent.toFixed(0), "%") });
                        }, option.MD5Method == 'fileInfo')];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        md5 = _a;
                        /***
                         * 当为Promise时elupload内部将根据resolve调用一次onSucces，
                         * 当前封装的上传逻辑不需要本次默认的调用而是需要根据其内部异步处理逻辑更具处理进度情况调用
                         * by kongj 2024.0913
                         **/
                        return [2 /*return*/, new Promise(function (_) {
                                var xhr = new XMLHttpRequest();
                                var urlParams = new URLSearchParams();
                                urlParams.append("title", option.file.name);
                                urlParams.append("md5", md5);
                                if (option.data) {
                                    for (var _i = 0, _a = Object.entries(option.data); _i < _a.length; _i++) {
                                        var _b = _a[_i], key = _b[0], value = _b[1];
                                        if (Array.isArray(value) && value.length)
                                            urlParams.append(key, value);
                                        else
                                            urlParams.append(key, value);
                                    }
                                }
                                _this.uploadNotify({ uid: option.file.uid, message: '稍等，正在上传中...' });
                                xhr.addEventListener('load', function () { return __awaiter(_this, void 0, void 0, function () {
                                    var result;
                                    var _this = this;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.nextProcess(xhr, option, function (uploadedMap) { return __awaiter(_this, void 0, void 0, function () {
                                                    var complete;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                option.loaded = 0;
                                                                return [4 /*yield*/, this.uploadCore(md5, option, uploadedMap)];
                                                            case 1:
                                                                complete = _a.sent();
                                                                complete && this.uploadNotify({ uid: option.file.uid, message: '' });
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); })];
                                            case 1:
                                                result = _a.sent();
                                                if (result && result.code == AjaxResultCode.uploadInstant) {
                                                    this.uploadNotify({ uid: option.file.uid, message: '' });
                                                }
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                xhr.addEventListener('error', function () {
                                    option.onError(_this.getError(option.action, option, xhr));
                                });
                                xhr.open('get', "".concat(option.action, "/preCheck?").concat(urlParams.toString()), true);
                                _this.setHeaders(xhr, option.headers, true);
                                xhr.send(urlParams);
                            })];
                }
            });
        });
    };
    return UploadRequestFactory;
}());
export default UploadRequestFactory;
