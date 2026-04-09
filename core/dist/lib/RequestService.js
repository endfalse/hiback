var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios, { AxiosError } from 'axios';
import TokenRequestHandler from './TokenRequestHandler';
import UploadService from './UploadService';
export class HibackError extends Error {
    constructor(m) {
        super(m);
        this.name = "HibackError";
    }
}
/**
 * @description 请求服务
 * @author kongjing
 * @date 2026.03.13
*/
class RequestService {
    get defaultInterceptor() {
        return (config) => {
            var _a;
            this.config.headerHook(config.headers);
            config.headers = config.headers || {};
            // JWT鉴权处理
            if ((_a = config.url) === null || _a === void 0 ? void 0 : _a.endsWith(this.config.refreshTokenApi)) {
                //如果在刷新令牌时不需要设置jwt头
                delete config.headers.Authorization;
            }
            else {
                const token = this.config.token();
                config.headers.Authorization = `Bearer ${token}`;
            }
            if (config != null && config.data && (config.method || 'get').toLowerCase() === "get") {
                config.params = config.data;
                delete config.data;
            }
            return config;
        };
    }
    constructor(config) {
        this.config = {
            baseUrl: 'https://j.jq123.net',
            refreshTokenApi: 'system/user/refreshToken',
            signOutWhen401And403Time: 500,
            useRefreshToken: false,
            debug: true,
            fileUpload: {
                api: 'https://j.jq123.net/file/uploadBig',
                chunkSize: 1024 * 1024 * 1,
                batchSize: 12,
                maxRetries: 3,
                retryDelay: 1000,
                uploadNotify: (_) => {
                    console.debug("尚未实现kconfig.api.fileUpload.uploadNotify");
                }
            },
            headerHook: () => {
                console.debug("尚未实现kconfig.api.headerHook");
            },
            signOut: () => {
                throw new HibackError("请实现此Hook->sinOut");
            },
            token: () => {
                return '---token---';
            },
            refreshToken: () => {
                return '---refreshToken---';
            },
            saveToken: () => {
                throw new HibackError("请实现此Hook->saveToken");
            },
            uploadNotify: (e) => {
                console.info('kconfig.uploadHook.uploadNotify->e:%o', e);
            },
            messageBox: () => {
                throw new HibackError("kconfig.ts尚未实现:messageBox(type:'error'|'success'|'warning'|'info',message:string)");
            },
            // merge(options:Optional<AxiosConfig>){
            //     for(const key in options){
            //         this[key] = options[key]
            //     }
            // }
        };
        this.isDevelopment = false;
        //处理UI级消息相应
        this.messagePop = (response, defaultMessage = '') => {
            this.config.messageBox({ status: response.status, code: response.data.code, message: response.data.message || defaultMessage });
        };
        // 错误处理
        this.showError = (error) => {
            var _a, _b, _c, _d, _e, _f;
            const { baseURL: configBaseURL, url: configURL } = error.config || {};
            // 1. 拼接 URL 并校验合法性
            let fullUrl = this.normalizeUrl(configBaseURL, configURL);
            // 2. 优先处理非法 URL 场景
            if (!fullUrl || !this.isUrlValid(fullUrl)) {
                const fallbackMessage = !this.isDevelopment
                    ? '请求地址异常，请稍后重试'
                    : `无效的请求地址：baseURL="${(_a = error.config) === null || _a === void 0 ? void 0 : _a.baseURL}", url="${(_b = error.config) === null || _b === void 0 ? void 0 : _b.url}"，拼接后："${fullUrl}"`;
                this.messagePop({
                    status: error.status || 500,
                    data: { code: 500, message: fallbackMessage, data: undefined }
                });
            }
            try {
                if (error instanceof AxiosError) {
                    if (this.isBizJsonResult((_c = error.response) === null || _c === void 0 ? void 0 : _c.data)) {
                        this.messagePop(error.response, `服务器错误，请稍后重试。`);
                    }
                    else {
                        const urlObj = new URL(fullUrl);
                        const host = urlObj.hostname;
                        const port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);
                        let baseMessage = '';
                        let userMessage = '';
                        // ========== 1. 端口程序未启动（核心场景） ==========
                        if (error.code === 'ECONNREFUSED') {
                            baseMessage = '服务暂时不可用，请稍后重试';
                            if (this.isDevelopment) {
                                // 精准提示：服务器启动但端口程序关闭
                                userMessage = `服务器 ${host} 已启动，但 ${port} 端口的服务未运行！请检查该端口的程序是否启动。`;
                            }
                        }
                        // ========== 2. 服务器连接超时/不可达 ==========
                        else if (['ETIMEDOUT', 'ENETUNREACH', 'ECONNABORTED'].includes(error.code || '')) {
                            baseMessage = '网络连接异常，请检查网络后重试';
                            if (this.isDevelopment) {
                                userMessage = `无法连接到服务器 ${host}，错误码：${error.code}，可能是服务器整机未启动或网络不通。`;
                            }
                        }
                        // ========== 3. 响应格式异常（ERR_BAD_RESPONSE） ==========
                        else if (error.code === 'ERR_BAD_RESPONSE') {
                            baseMessage = '服务响应格式异常，请稍后重试';
                            if (this.isDevelopment) {
                                // 仅提示「程序已启动但响应异常」，排除端口未启动的误导
                                userMessage = `服务器 ${host}:${port} 程序已启动，但返回非法响应（ERR_BAD_RESPONSE）！可能是响应格式错误/空响应，原始响应：${JSON.stringify(((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) || '空响应')}`;
                            }
                        }
                        // ========== 4. 服务器内部错误（500） ==========
                        else if (((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) === 500) {
                            baseMessage = '服务器繁忙，请稍后重试';
                            if (this.isDevelopment) {
                                userMessage = `服务器 ${host}:${port} 程序已启动，但处理请求时发生内部错误（500），响应：${JSON.stringify(error.response.data)}`;
                            }
                        }
                        // ========== 5. 其他错误 ==========
                        else {
                            const status = ((_f = error.response) === null || _f === void 0 ? void 0 : _f.status) || '未知';
                            baseMessage = `请求失败（${status}），请稍后重试`;
                            if (this.isDevelopment) {
                                userMessage = `请求失败，状态码：${status}，错误码：${error.code}，信息：${error.message}`;
                            }
                        }
                        const badMessage = !this.isDevelopment ? baseMessage : userMessage;
                        const status = error.status || 500;
                        this.messagePop({ status, data: { code: status, message: badMessage, data: undefined } });
                    }
                }
                else {
                    this.messagePop(error, "网络或服务器错误，请稍后重试。");
                }
            }
            catch (urlParseError) {
                // 兜底：极端情况（校验通过但解析失败）
                const fallbackMessage = !this.isDevelopment
                    ? '请求地址异常，请稍后重试'
                    : `URL 解析失败：${fullUrl}，错误：${urlParseError.message}`;
                this.messagePop({
                    status: error.status || 500,
                    data: { code: 500, message: fallbackMessage, data: undefined }
                });
            }
        };
        //从Http响应中获取业务级响应
        this.defaultResponseAdapter = (nativeResponse) => {
            return new Promise((reslove, reject) => {
                let response;
                const { data: retResult } = nativeResponse;
                if (retResult && typeof (retResult.code) !== 'undefined') {
                    response = retResult.code === 200
                        ? (retResult.data !== undefined ? retResult.data : true)
                        : (retResult.data !== undefined ? retResult.data : false);
                    if (response === false) {
                        return reject('Business error: API returned false directly');
                    }
                }
                else {
                    response = retResult;
                }
                reslove(response);
            });
        };
        /**
         * 处理响应入口
        */
        this.responseProcess = (response) => {
            this.messagePop(response);
            return new Promise((resolve, reject) => this.resolveResponse(response, resolve, reject));
        };
        /**
         * 从Http相应获取重新包装的响应内容
        */
        this.getAxiosResponse = (xhr, requestConfig = {}) => {
            return this.convertXhrToAxiosResponse(xhr, requestConfig);
        };
        /**
         * @description 系统前端开发快速应用接口的能力，并提供标准的接口请求和响应处理
         * @author kongjing
         * @date 2022.10.12
        */
        this.request = (config, contentType = undefined) => {
            contentType = contentType || 'application/json';
            if (contentType) {
                config.headers = config.headers || {};
                config.headers['Content-Type'] = contentType;
            }
            return this.service(config);
        };
        for (const key in config) {
            typeof (config[key]) !== undefined && (this.config[key] = config[key]);
        }
        this.isDevelopment = !!this.config.debug;
        this.config.responseAdapter = this.config.responseAdapter || this.defaultResponseAdapter;
        this.service = axios.create({ baseURL: this.config.baseUrl, timeout: this.config.timeout });
        this.config.tokenRequestHandler = this.config.tokenRequestHandler || (new TokenRequestHandler(this, {
            useRefreshToken: this.config.useRefreshToken,
            refreshToken: () => __awaiter(this, void 0, void 0, function* () {
                const refreshToken = this.config.refreshToken();
                if (!refreshToken)
                    throw new HibackError('无刷新令牌');
                const res = yield this.request({
                    url: this.config.refreshTokenApi,
                    data: { refreshToken },
                    method: 'post'
                });
                if (!res.token || !res.refreshToken) {
                    throw new HibackError('令牌刷新失败');
                }
                this.config.saveToken(res.token, res.refreshToken);
                return res.token;
            })
        }));
        // 请求拦截器
        this.service.interceptors.request.use(this.defaultInterceptor, (error) => { return Promise.reject(error); });
        // 响应拦截器
        this.service.interceptors.response.use(this.responseProcess, (error) => {
            var _a;
            return (_a = this.config.tokenRequestHandler) === null || _a === void 0 ? void 0 : _a.handleRequestError(error).catch((reason) => {
                if (reason) {
                    if ((reason === null || reason === void 0 ? void 0 : reason.code) === '401' || (reason === null || reason === void 0 ? void 0 : reason.code) === 'REFRESH_TOKEN_FAILED') {
                        setTimeout(() => {
                            this.config.signOut(true);
                        }, this.config.signOutWhen401And403Time || 300);
                    }
                    else {
                        this.showError(reason);
                    }
                }
                return Promise.reject(reason);
            });
        });
        this.uploadService = new UploadService(this);
    }
    get axiosConfig() {
        return this.config;
    }
    isBizJsonResult(ajaxResult) {
        return ajaxResult && typeof ajaxResult === 'object' && 'code' in ajaxResult;
    }
    /**
     * 规范化拼接 URL，自动处理重复斜杠问题
     * @param baseURL - 基础地址（如 https://api.example.com/）
     * @param url - 接口路径（如 /user/list）
     * @returns 规范化的完整 URL
     */
    normalizeUrl(baseURL, url) {
        // 空值处理
        const normalizedBase = (baseURL === null || baseURL === void 0 ? void 0 : baseURL.trim().replace(/\/+$/, '')) || '';
        const normalizedUrl = (url === null || url === void 0 ? void 0 : url.trim().replace(/^\/+/, '')) || '';
        // 第一步：拼接 Axios 的 baseURL 和接口路径
        let fullUrl = '';
        if (!normalizedBase) {
            fullUrl = normalizedUrl;
        }
        else if (!normalizedUrl) {
            fullUrl = normalizedBase;
        }
        else {
            fullUrl = `${normalizedBase}/${normalizedUrl}`;
        }
        // 第二步：处理相对路径（核心优化：读取环境变量，无硬编码）
        if (fullUrl && !fullUrl.startsWith('http') && typeof window !== 'undefined') {
            const origin = window.location.origin; // 自动获取协议+主机+端口，如 http://localhost:8080
            fullUrl = `${origin}/${fullUrl.replace(/^\/+/, '')}`;
        }
        return fullUrl;
    }
    /**
     * 校验 URL 是否合法
     * @param url - 待校验的 URL 字符串
     * @returns 是否合法
     */
    isUrlValid(url) {
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
    }
    //处理业务级响应AxiosResponse<TRetData, TRequestData> | PromiseLike<AxiosResponse<TRetData, TRequestData>>
    resolveResponse(response, resolve, reject) {
        try {
            const res = this.config.responseAdapter(response);
            resolve(res);
        }
        catch (error) {
            reject(error);
        }
    }
    /**
     * 将 XHR 响应转换为 AxiosResponse 实例
     * @param xhr XHR 实例
     * @param requestConfig 请求配置（构造 config 字段）
     * @returns 符合 AxiosResponse 规范的实例
     */
    convertXhrToAxiosResponse(xhr, requestConfig = {}) {
        // 1. 确定 data 字段（根据 responseType 适配）
        let data;
        const responseType = requestConfig.responseType || xhr.responseType;
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
        const axiosResponse = {
            data,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: this.parseResponseHeaders(xhr.getAllResponseHeaders()),
            config: Object.assign({ 
                // 补全默认请求配置
                url: requestConfig.url || xhr.responseURL, method: requestConfig.method || 'GET', headers: requestConfig.headers, data: requestConfig.data, responseType: responseType || 'text' }, requestConfig),
            request: xhr // 关联原始 XHR 实例
        };
        return axiosResponse;
    }
    parseResponseHeaders(headersStr) {
        const headers = {};
        if (!headersStr || typeof headersStr !== 'string')
            return headers;
        // 分割响应头并解析为键值对（过滤空行）
        headersStr.split('\r\n').forEach(line => {
            // 去除整行首尾空白，过滤空行
            const trimmedLine = line.trim();
            if (!trimmedLine)
                return;
            // 找到第一个冒号的位置（避免值中包含冒号导致分割错误）
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex === -1)
                return; // 无效的头行（无冒号）
            // 分割键和值，分别去除首尾空格
            const key = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
            const value = trimmedLine.substring(colonIndex + 1).trim();
            if (!key)
                return; // 空键跳过
            // 处理多值头：始终保持数组类型（符合 Axios 规范）
            if (headers[key]) {
                // 如果已有值，确保是数组并追加
                headers[key] = Array.isArray(headers[key])
                    ? [...headers[key], value]
                    : [headers[key], value];
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
    }
    //上传文件
    uploadFile(file, opts) {
        return this.uploadService.upload(file, opts);
    }
    //组件使用
    get uploadRequestHandler() {
        return this.uploadService.getUploadRequestHandler();
    }
    /**
     * @description 适配相应为标准处理
     * @author kongjing
     * @date 2026.03.11
     */ //xhr:XMLHttpRequest TRetData=any,TRequestData=any
    responseAdapter(nativeResponse) {
        return this.config.responseAdapter(nativeResponse);
    }
}
export default RequestService;
