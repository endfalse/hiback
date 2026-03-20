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
import { getBlobMd5, getFileMd5 } from "../utils/index";
import { HibackError } from "./RequestService";
import { v4 as uuidv4 } from 'uuid';
/**
 * @description 文件上传服务
 * @author kongjing
 * @date 2026.03.13
*/
var UploadService = /** @class */ (function () {
    function UploadService(requestFactoryInstance) {
        var _this = this;
        this.uploadedChunks = 0;
        this.getUploadLoaded = function (completedChunks, size) {
            var loaded = Array.from(completedChunks).reduce(function (sum, num) {
                var s = num * _this.config.chunkSize;
                var e = Math.min(s + _this.config.chunkSize, size);
                return sum + (e - s);
            }, 0);
            var progress = Math.round((loaded / size) * 100);
            return { progress: progress, loaded: loaded };
        };
        this.requestFactoryInstance = requestFactoryInstance;
        this.config = requestFactoryInstance.axiosConfig.fileUpload;
        this.config.api = this.config.api || '/upload';
        this.config.chunkSize = this.config.chunkSize || 10 * 1024 * 1024;
        this.config.batchSize = this.config.batchSize || 12;
        this.uploadNotify = this.config.uploadNotify || (function () { });
    }
    /**
     * @description 提供通用文件上传的封装
     * @author kongjing
     * @date 2026.03.13
     * */
    UploadService.prototype.upload = function (file, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var requestOpts, ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestOpts = {
                            api: opts.api,
                            method: 'post',
                            file: file,
                            data: opts.data,
                            headers: opts.headers,
                            uploadNotify: opts.uploadNotify
                        };
                        if (!(opts.chunk !== true)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.normalUpload(requestOpts)];
                    case 1:
                        ret = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.uploadChunks({
                            method: 'post',
                            file: file,
                            data: opts.data,
                            headers: opts.headers,
                            uploadNotify: opts.uploadNotify
                        })];
                    case 3:
                        ret = _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, ret];
                }
            });
        });
    };
    /**
    * @description 提供文件上传的封装，使用与el-plus和编辑器文件上传等配置
    * @author kongjing
    * @date 2026.03.13
    * */
    UploadService.prototype.httpRequest = function (option) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (typeof XMLHttpRequest === 'undefined') {
                    throw new HibackError("[XMLHttpRequest is undefined");
                }
                return [2 /*return*/, new Promise(function (reslove) {
                        reslove(function (opts) { return __awaiter(_this, void 0, void 0, function () {
                            var ret;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        opts.method = option.method || 'POST';
                                        opts.file.uid = opts.file.uid || uuidv4();
                                        return [4 /*yield*/, this.upload(option.file, {
                                                data: opts.data,
                                                headers: opts.headers,
                                                chunk: option.chunk,
                                                api: opts.action,
                                                uploadNotify: function (e) {
                                                    opts.onProgress({
                                                        percent: e.progress, target: option.file
                                                    });
                                                    //opts.onProgress({percent:e.progress,target:option.file} as any)
                                                }
                                            })];
                                    case 1:
                                        ret = _a.sent();
                                        opts.onSuccess({ code: 200, data: ret, message: "上传完成" });
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    })];
            });
        });
    };
    UploadService.prototype.getUploadId = function (meta_1, data_1, headers_1) {
        return __awaiter(this, arguments, void 0, function (meta, data, headers, api) {
            var requestData, key, uploadId;
            if (api === void 0) { api = undefined; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestData = new FormData();
                        // 传递partup参数，标识“初始化获取uploadId”
                        requestData.append('partup', 'true');
                        requestData.append('md5', meta.md5);
                        requestData.append('fileName', meta.name);
                        requestData.append('fileSize', meta.size);
                        requestData.append('fileType', meta.type);
                        requestData.append('totalChunks', meta.totalChunks);
                        requestData.append('chunkSize', this.config.chunkSize);
                        if (data) {
                            for (key in data) {
                                requestData.append(key, data[key]);
                            }
                        }
                        return [4 /*yield*/, this.requestFactoryInstance.request({
                                url: api || this.config.api,
                                data: requestData,
                                method: 'post',
                                headers: headers
                            }, 'multipart/form-data')];
                    case 1:
                        uploadId = _a.sent();
                        return [2 /*return*/, uploadId];
                }
            });
        });
    };
    UploadService.prototype.normalUpload = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var id, formData, key, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = uuidv4();
                        formData = new FormData();
                        formData.append('fileName', options.file.name);
                        formData.append('file', options.file);
                        if (options.data) {
                            for (key in options.data) {
                                formData.append(key, options.data[key]);
                            }
                        }
                        return [4 /*yield*/, this.requestFactoryInstance.request({
                                url: options.api || this.config.api,
                                data: formData,
                                method: 'post',
                                headers: options.headers,
                                timeout: 0
                            }, 'multipart/form-data')];
                    case 1:
                        response = _a.sent();
                        options.uploadNotify && options.uploadNotify({
                            id: id,
                            message: '上传完成',
                            loaded: options.file.size,
                            total: options.file.size,
                            progress: 100
                        });
                        return [2 /*return*/, this.getResponseData(id, response)];
                }
            });
        });
    };
    UploadService.prototype.uploadChunks = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var id, finalResponse, md5, batchSize, totalChunks, meta_1, uploadId_1, completedChunks_1, i, batchChunkNumbers, j, batchPromises, batchResults, failedChunks, _a, loaded, progress, failReasons, error, error_1, err;
                        var _this = this;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    this.uploadNotify = options.uploadNotify || this.uploadNotify;
                                    id = uuidv4();
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 8, , 9]);
                                    return [4 /*yield*/, getFileMd5(id, options.file, this.uploadNotify)
                                        // 每批并发数（可配置）
                                    ];
                                case 2:
                                    md5 = _b.sent();
                                    batchSize = this.config.batchSize;
                                    totalChunks = Math.ceil(options.file.size / this.config.chunkSize);
                                    this.uploadNotify({ id: id, message: '正在获取上传ID...', loaded: 0, total: options.file.size, progress: 0 });
                                    meta_1 = { totalChunks: totalChunks, name: options.file.name, size: options.file.size, type: options.file.type, md5: md5 };
                                    return [4 /*yield*/, this.getUploadId(meta_1, options.data, options.headers, options.api)];
                                case 3:
                                    uploadId_1 = _b.sent();
                                    this.uploadNotify({ id: id, message: '开始上传...', loaded: 0, total: options.file.size, progress: 0 });
                                    completedChunks_1 = new Set();
                                    i = 0;
                                    _b.label = 4;
                                case 4:
                                    if (!(i < totalChunks)) return [3 /*break*/, 7];
                                    batchChunkNumbers = [];
                                    for (j = 0; j < batchSize && (i + j) < totalChunks; j++) {
                                        batchChunkNumbers.push(i + j);
                                    }
                                    batchPromises = batchChunkNumbers.map(function (chunkNumber) { return __awaiter(_this, void 0, void 0, function () {
                                        var start, end, chunkBlob, currentResponse;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    start = chunkNumber * this.config.chunkSize;
                                                    end = Math.min(start + this.config.chunkSize, meta_1.size);
                                                    chunkBlob = options.file.slice(start, end);
                                                    return [4 /*yield*/, this.uploadChunkWithRetry(__assign(__assign({ id: id, uploadId: uploadId_1, chunkNumber: chunkNumber, chunkBlob: chunkBlob }, meta_1), { completedChunks: completedChunks_1 }), options.data, options.headers, options.api, this.config.maxRetries, this.config.retryDelay)];
                                                case 1:
                                                    currentResponse = _a.sent();
                                                    finalResponse = this.getResponseData(id, currentResponse);
                                                    // 上传成功后：记录已完成的分片（Set 自动去重，并发安全）
                                                    completedChunks_1.add(chunkNumber);
                                                    return [2 /*return*/, finalResponse];
                                            }
                                        });
                                    }); });
                                    return [4 /*yield*/, Promise.allSettled(batchPromises)
                                        // 检查批次内是否有失败的分片
                                    ];
                                case 5:
                                    batchResults = _b.sent();
                                    failedChunks = batchResults.filter(function (result) { return result.status === 'rejected'; });
                                    if (failedChunks.length > 0) {
                                        _a = this.getUploadLoaded(completedChunks_1, options.file.size), loaded = _a.loaded, progress = _a.progress;
                                        failReasons = failedChunks.map(function (res) { return res.reason; }).join('; ');
                                        error = new Error("\u6279\u6B21".concat(i / batchSize + 1, "\u6709").concat(failedChunks.length, "\u4E2A\u5206\u7247\u4E0A\u4F20\u5931\u8D25:").concat(failReasons));
                                        this.uploadNotify({
                                            id: id,
                                            message: error.message,
                                            loaded: loaded,
                                            total: options.file.size,
                                            progress: progress
                                        });
                                        // 终止整个上传流程
                                        reject(error);
                                        // 避免后续执行
                                        return [2 /*return*/];
                                    }
                                    _b.label = 6;
                                case 6:
                                    i += batchSize;
                                    return [3 /*break*/, 4];
                                case 7:
                                    // 所有分片上传完成后：统一resolve收集到的有效结果
                                    if (finalResponse) {
                                        this.uploadNotify({
                                            id: id,
                                            message: '上传完成',
                                            loaded: options.file.size,
                                            total: options.file.size,
                                            progress: 100
                                        });
                                        resolve(finalResponse);
                                    }
                                    else {
                                        this.uploadNotify({
                                            id: id,
                                            message: '所有分片上传完成，但未获取到有效结果',
                                            loaded: options.file.size,
                                            total: options.file.size,
                                            progress: 100
                                        });
                                        resolve(undefined);
                                    }
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_1 = _b.sent();
                                    err = error_1 instanceof Error ? error_1 : new Error('上传过程中发生未知错误');
                                    this.uploadNotify({
                                        id: id,
                                        message: err.message,
                                        loaded: 0,
                                        total: options.file.size,
                                        progress: 0
                                    });
                                    reject(err);
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UploadService.prototype.uploadChunkWithRetry = function (chunkParams_1, data_1, headers_1, api_1) {
        return __awaiter(this, arguments, void 0, function (chunkParams, data, headers, api, maxRetries, // 默认最大重试3次
        retryDelay // 重试间隔1秒（可选，避免频繁重试）
        ) {
            var attempt, _a, currentLoaded, progress, response, error_2;
            if (maxRetries === void 0) { maxRetries = 3; }
            if (retryDelay === void 0) { retryDelay = 1000; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        attempt = 0;
                        _a = this.getUploadLoaded(chunkParams.completedChunks, chunkParams.size), currentLoaded = _a.loaded, progress = _a.progress;
                        _b.label = 1;
                    case 1:
                        if (!(attempt < maxRetries)) return [3 /*break*/, 7];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, this.uploadChunk(chunkParams, data, headers, api)
                            // 上传成功：返回结果
                        ];
                    case 3:
                        response = _b.sent();
                        // 上传成功：返回结果
                        return [2 /*return*/, response];
                    case 4:
                        error_2 = _b.sent();
                        attempt++; // 重试次数+1
                        // 达到最大重试次数：抛出错误，终止重试
                        if (attempt >= maxRetries) {
                            this.uploadNotify({
                                id: chunkParams.id,
                                loaded: currentLoaded,
                                total: chunkParams.size,
                                message: "\u5206\u7247 ".concat(chunkParams.chunkNumber, " \u4E0A\u4F20\u5931\u8D25\uFF08\u5DF2\u91CD\u8BD5").concat(maxRetries, "\u6B21\uFF09"),
                                progress: progress,
                            });
                            throw error_2; // 抛出错误，让外层 Promise 变为 rejected
                        }
                        // 未达到最大次数：提示并重试
                        this.uploadNotify({
                            id: chunkParams.id,
                            loaded: currentLoaded,
                            total: chunkParams.size,
                            message: "\u5206\u7247 ".concat(chunkParams.chunkNumber, " \u4E0A\u4F20\u5931\u8D25\uFF0C\u6B63\u5728\u91CD\u8BD5\uFF08").concat(attempt, "/").concat(maxRetries, "\uFF09"),
                            progress: progress
                        });
                        // 重试前等待指定间隔（避免高频重试触发服务端限流）
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, retryDelay); })];
                    case 5:
                        // 重试前等待指定间隔（避免高频重试触发服务端限流）
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 1];
                    case 7: 
                    // 理论上不会走到这里，兜底抛出错误
                    throw new Error("\u5206\u7247 ".concat(chunkParams.chunkNumber, " \u4E0A\u4F20\u5931\u8D25\uFF0C\u5DF2\u8FBE\u6700\u5927\u91CD\u8BD5\u6B21\u6570"));
                }
            });
        });
    };
    UploadService.prototype.uploadChunk = function (upMetadata_1, data_1, headers_1) {
        return __awaiter(this, arguments, void 0, function (upMetadata, data, headers, api) {
            var chunkMd5, formData, key, response, _a, loaded, progress;
            if (api === void 0) { api = undefined; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.uploadedChunks++;
                        return [4 /*yield*/, getBlobMd5(upMetadata.chunkBlob)
                            // 构建FormData（参数完全匹配要求：uploadId、chunkMd5、chunkNumber、totalNumber、fileName、chunkSize）
                        ];
                    case 1:
                        chunkMd5 = _b.sent();
                        formData = new FormData();
                        formData.append('uploadId', upMetadata.uploadId);
                        formData.append('chunkMd5', chunkMd5);
                        formData.append('chunkNumber', upMetadata.chunkNumber); // 分片序号（从0开始，可根据后端要求调整为从1开始）
                        formData.append('totalChunks', upMetadata.totalChunks); // 总分片数
                        formData.append('fileName', upMetadata.name);
                        formData.append('chunkSize', this.config.chunkSize);
                        formData.append('chunkFile', upMetadata.chunkBlob, "".concat(upMetadata.uploadId, "_").concat(upMetadata.chunkNumber, ".tmp")); // 分片文件
                        if (data) {
                            for (key in data) {
                                formData.append(key, data[key]);
                            }
                        }
                        return [4 /*yield*/, this.requestFactoryInstance.request({
                                url: api || this.config.api,
                                data: formData,
                                method: 'post',
                                headers: headers,
                                timeout: 0
                            }, 'multipart/form-data')
                            //计算全局已上传大小
                        ];
                    case 2:
                        response = _b.sent();
                        _a = this.getUploadLoaded(upMetadata.completedChunks, upMetadata.size), loaded = _a.loaded, progress = _a.progress;
                        this.uploadNotify({
                            id: upMetadata.id,
                            loaded: loaded,
                            total: upMetadata.size,
                            message: "\u7B2C".concat(upMetadata.chunkNumber + 1, "/").concat(upMetadata.totalChunks, "\u4E2A\u5206\u7247\u4E0A\u4F20\u6210\u529F"),
                            progress: progress
                        });
                        return [2 /*return*/, response];
                }
            });
        });
    };
    /**
     * 检查单个response项是否满足返回undefined的条件
     * @param {any} item - 单个响应项
     * @returns {boolean} 是否满足条件
     */
    UploadService.prototype.checkSingleResponse = function (item) {
        // 核心判断：仅检查status不等于3 或 file不存在/为假
        // 增加类型检查，避免访问属性时报错
        return typeof item === 'object' && item !== null
            ? (item.status !== 3 || !item.file)
            : false; // 非对象类型（如布尔/字符串等）不满足条件
    };
    UploadService.prototype.getResponseData = function (id, response) {
        var _this = this;
        // 封装：解析单个 response 项为 ComplexUploaded
        var parseSingleItem = function (itemResponse) {
            // 1. 前置空值保护 + 条件判断（避免重复调用 checkSingleResponse）
            if (!itemResponse || !itemResponse.file || _this.checkSingleResponse(itemResponse)) {
                return undefined;
            }
            // 2. 解构 file 属性并增加默认值，避免访问不存在的属性
            var _a = itemResponse.file || {}, accessUrl = _a.accessUrl, thumbnailUrl = _a.thumbnailUrl, uniqueId = _a.uniqueId, width = _a.width, height = _a.height, posterUrl = _a.posterUrl, duration = _a.duration, taskId = _a.taskId;
            // 3. 修复类型判断错误 + 简化分支逻辑
            // 基础文件（仅核心字段）
            if (uniqueId && accessUrl && thumbnailUrl) {
                return { id: id, uniqueId: uniqueId, accessUrl: accessUrl, thumbnailUrl: thumbnailUrl, taskId: taskId };
            }
            // 图片（有宽高，无时长/海报）
            if (uniqueId && accessUrl && thumbnailUrl &&
                typeof width === 'number' && typeof height === 'number' &&
                typeof duration === 'undefined' && !posterUrl) {
                return { id: id, uniqueId: uniqueId, accessUrl: accessUrl, thumbnailUrl: thumbnailUrl, width: width, height: height, taskId: taskId };
            }
            // 视频（有海报/时长，无缩略图）
            if (uniqueId && accessUrl && posterUrl &&
                typeof width === 'number' && typeof height === 'number' &&
                typeof duration === 'number' && !thumbnailUrl) {
                return { id: id, uniqueId: uniqueId, accessUrl: accessUrl, posterUrl: posterUrl, width: width, height: height, duration: duration, taskId: taskId };
            }
            return undefined;
        };
        // 4. 先判断是否需要直接返回 undefined（仅执行一次 checkSingleResponse）
        var shouldReturnUndefined = Array.isArray(response)
            ? response.some(this.checkSingleResponse)
            : this.checkSingleResponse(response);
        if (shouldReturnUndefined) {
            return undefined;
        }
        // 5. 解析数据（数组/非数组分支简化）
        if (Array.isArray(response)) {
            var parsedList = response.map(parseSingleItem).filter(Boolean);
            return parsedList.length > 0 ? parsedList : undefined;
        }
        return parseSingleItem(response);
    };
    return UploadService;
}());
export default UploadService;
