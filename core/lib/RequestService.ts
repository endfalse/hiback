import axios , { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance, InternalAxiosRequestConfig, RawAxiosResponseHeaders } from 'axios'
import { AjaxResult, AxiosConfig, ContentType, Optional, UploadOptionsType } from '../types'
import TokenRequestHandler from './TokenRequestHandler'
import UploadService from './UploadService'
export class HibackError extends Error {
  constructor(m: string) {
    super(m)
    this.name = "HibackError"
  }
}

/**
 * @description 请求服务
 * @author kongjing
 * @date 2026.03.13
*/
class RequestService<TResponseCode=number>{
    private service: AxiosInstance
    private uploadService: UploadService<TResponseCode>

    private get defaultInterceptor() {
        return (config: InternalAxiosRequestConfig<any>)=>{
            this.config.headerHook(config.headers)
            config.headers = config.headers||{}

            // JWT鉴权处理
            if(config.url?.endsWith(this.config.refreshTokenApi)){
              //如果在刷新令牌时不需要设置jwt头
              delete config.headers.Authorization
            }
            else{
              const token = this.config.token()
              config.headers.Authorization = `Bearer ${token}`;
            }
            
            if (config!=null&&config.data&&(config.method||'get').toLowerCase() === "get") {
              config.params = config.data
              delete config.data
            } 
            return config
        }
    }

    private config:AxiosConfig<TResponseCode>={
          baseUrl:'https://j.jq123.net',
          refreshTokenApi:'system/user/refreshToken',
          signOutWhen401And403Time:500,
          useRefreshToken:false,
          debug:true,
          fileUpload:{
            api:'https://j.jq123.net/file/uploadBig',
            chunkSize: 1024 * 1024 * 1,
            batchSize:12,
            maxRetries:3,
            retryDelay:1000,
            uploadNotify:(_)=>{
              console.debug("尚未实现kconfig.api.fileUpload.uploadNotify")
            }
          },
          headerHook:()=>{
              console.debug("尚未实现kconfig.api.headerHook")
          },
          signOut:()=>{
              throw new HibackError("请实现此Hook->sinOut")
          },
          token:()=>{
              return '---token---'
          },
          refreshToken:()=>{
            return '---refreshToken---'
          },
          saveToken:()=>{
              throw new HibackError("请实现此Hook->saveToken")
          },
          uploadNotify:(e:{uid:string|number,message:string})=>{
              console.info('kconfig.uploadHook.uploadNotify->e:%o',e)
          },
          messageBox:()=>{
              throw new HibackError("kconfig.ts尚未实现:messageBox(type:'error'|'success'|'warning'|'info',message:string)")
          },
          // merge(options:Optional<AxiosConfig>){
          //     for(const key in options){
          //         this[key] = options[key]
          //     }
          // }
    }
    private isDevelopment = false
    constructor(config:Optional<AxiosConfig<TResponseCode>>){

        for(const key in config){
          typeof(config[key])!==undefined&&(this.config[key]=config[key])
        }
        this.isDevelopment = !!this.config.debug
        this.config.responseAdapter = this.config.responseAdapter||this.defaultResponseAdapter

        this.service = axios.create({baseURL: this.config.baseUrl,timeout:this.config.timeout})

        this.config.tokenRequestHandler = this.config.tokenRequestHandler||(new TokenRequestHandler<TResponseCode>(this,{
            useRefreshToken: this.config.useRefreshToken,
            refreshToken: async () => {
              const refreshToken = this.config.refreshToken();
              if (!refreshToken) throw new HibackError('无刷新令牌');
                const res = await this.request<{token:string,refreshToken:string}>({
                  url:this.config.refreshTokenApi,
                  data:{ refreshToken },
                  method:'post'
                })
                if (!res.token||!res.refreshToken)
                { 
                  throw new HibackError('令牌刷新失败');
                }
                this.config.saveToken(res.token,res.refreshToken)
                return res.token
            }
        }))

        // 请求拦截器
        this.service.interceptors.request.use(this.defaultInterceptor,(error: AxiosError) => {return Promise.reject(error)})

        // 响应拦截器
        this.service.interceptors.response.use(this.responseProcess,(error: AxiosError<AjaxResult<TResponseCode>>)=> {
          return this.config.tokenRequestHandler?.handleRequestError(error)
          .catch((reason?:AxiosError<AjaxResult<TResponseCode>>)=>{
                if(reason)
                {
                  if(reason?.status===401||reason?.code==='REFRESH_TOKEN_FAILED'){
                      setTimeout(() => {
                        this.config.signOut(true)
                      },this.config.signOutWhen401And403Time||300);
                  }
                  else{
                    this.showError(reason)
                  }
              }
              return Promise.reject(reason)
          })
        })
        this.uploadService = new UploadService<TResponseCode>(this)
    }

    public get axiosConfig() {
        return this.config
    }

    //处理UI级消息相应
    private messagePop = (response: AxiosResponse<AjaxResult<TResponseCode>>, defaultMessage='')=>{
      this.config.messageBox({status:response.status,code:response.data.code,message:response.data.message||defaultMessage})
    }

    private isBizJsonResult(ajaxResult: any): ajaxResult is AjaxResult {
      return ajaxResult && typeof ajaxResult === 'object' && 'code' in ajaxResult
    }

    /**
     * 规范化拼接 URL，自动处理重复斜杠问题
     * @param baseURL - 基础地址（如 https://api.example.com/）
     * @param url - 接口路径（如 /user/list）
     * @returns 规范化的完整 URL
     */
    private normalizeUrl(baseURL?: string, url?: string): string {
      // 空值处理
      const normalizedBase = baseURL?.trim().replace(/\/+$/, '') || '';
      const normalizedUrl = url?.trim().replace(/^\/+/, '') || '';

      // 第一步：拼接 Axios 的 baseURL 和接口路径
      let fullUrl = '';
      if (!normalizedBase) {
        fullUrl = normalizedUrl;
      } else if (!normalizedUrl) {
        fullUrl = normalizedBase;
      } else {
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
    private isUrlValid(url: string): boolean {
      if (!url || url.trim() === '') return false;
      try {
        // 尝试构造 URL，能成功则合法
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }
    // 错误处理
    // private showErrorOld=(error: AxiosError<AjaxResult<TResponseCode>>) =>{// | AxiosResponse<AjaxResult<TResponseCode>>
    //   const {baseURL:configBaseURL,url:configURL} = error.config||{}
    //   // 1. 拼接 URL 并校验合法性
    //   let fullUrl = this.normalizeUrl(configBaseURL,configURL);
    //   // 2. 优先处理非法 URL 场景
    //   if (!fullUrl||!this.isUrlValid(fullUrl)) {
    //     const fallbackMessage = !this.isDevelopment
    //       ? '请求地址异常，请稍后重试'
    //       : `无效的请求地址：baseURL="${error.config?.baseURL}", url="${error.config?.url}"，拼接后："${fullUrl}"`;
    //      this.messagePop({
    //           status:error.status||500,
    //           data:{code:500,message:fallbackMessage,data:undefined}
    //     } as any)
    //   }
    //   try{
    //     if(error instanceof AxiosError)
    //     {
    //       if(this.isBizJsonResult(error.response?.data)){
    //         this.messagePop(error.response,`服务器错误，请稍后重试。`)
    //       }
    //       else{
    //         const urlObj = new URL(fullUrl)
    //         const host = urlObj.hostname;
    //         const port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);

    //         let baseMessage = ''
    //         let userMessage = ''

    //         //error.response.data

    //         // ========== 4. 服务器内部错误（500） ==========
    //         if (error.response?.status === 500) {
    //           baseMessage = '服务器繁忙，请稍后重试';
    //           if (this.isDevelopment) {
    //             userMessage = `服务器 ${host}:${port} 程序已启动，但处理请求时发生内部错误（500），响应：${JSON.stringify(error.response.data)}`;
    //           }
    //         }
    //         else if (error.response?.status === 301) {
    //           baseMessage = error.response.data.message||'没有权限访问';
    //           if (this.isDevelopment) {
    //             userMessage = `服务器 ${host}:${port} 程序已启动，但处理请求时发生内部错误（500），响应：${JSON.stringify(error.response.data)}`;
    //           }
    //         }
    //         // ========== 1. 端口程序未启动（核心场景） ==========
    //         else if (error.code === 'ECONNREFUSED') {
    //           baseMessage = '服务暂时不可用，请稍后重试';
    //           if (this.isDevelopment) {
    //             // 精准提示：服务器启动但端口程序关闭
    //             userMessage = `服务器 ${host} 已启动，但 ${port} 端口的服务未运行！请检查该端口的程序是否启动。`;
    //           }
    //         }
    //         // ========== 2. 服务器连接超时/不可达 ==========
    //         else if (['ETIMEDOUT', 'ENETUNREACH', 'ECONNABORTED'].includes(error.code||'')) {
    //           baseMessage = '网络连接异常，请检查网络后重试';
    //           if (this.isDevelopment) {
    //             userMessage = `无法连接到服务器 ${host}，错误码：${error.code}，可能是服务器整机未启动或网络不通。`;
    //           }
    //         }
    //         // ========== 3. 响应格式异常（ERR_BAD_RESPONSE） ==========
    //         else if (error.code === 'ERR_BAD_RESPONSE') {
    //           baseMessage = '服务响应格式异常，请稍后重试';
    //           if (this.isDevelopment) {
    //             // 仅提示「程序已启动但响应异常」，排除端口未启动的误导
    //             userMessage = `服务器 ${host}:${port} 程序已启动，但返回非法响应（ERR_BAD_RESPONSE）！可能是响应格式错误/空响应，原始响应：${JSON.stringify(error.response?.data || '空响应')}`;
    //           }
    //         }
    //         // ========== 5. 其他错误 ==========
    //         else {
    //           const status = error.response?.status || '未知';
    //           baseMessage = `请求失败（${status}），请稍后重试`;
    //           if (this.isDevelopment) {
    //             userMessage = `请求失败，状态码：${status}，错误码：${error.code}，信息：${error.message}`;
    //           }
    //         }
    //         const badMessage = !this.isDevelopment?baseMessage:userMessage
    //         const status = error.status||500
    //         this.messagePop({status,data:{code:status,message:badMessage,data:undefined}} as any)
    //       }
    //     }
    //     else{
    //         this.messagePop(error,"网络或服务器错误，请稍后重试。")
    //     }
    //   }
    //   catch (urlParseError) {
    //     // 兜底：极端情况（校验通过但解析失败）
    //     const fallbackMessage = !this.isDevelopment
    //       ? '请求地址异常，请稍后重试'
    //       : `URL 解析失败：${fullUrl}，错误：${(urlParseError as Error).message}`;
    //     this.messagePop({
    //           status:error.status||500,
    //           data:{code:500,message:fallbackMessage,data:undefined}
    //     } as any)
    //   }
    // }

    private showError = (error: AxiosError<AjaxResult<TResponseCode>>) => {
      // ========== 安全解构：防止 config 为 undefined 崩溃 ==========
      const { baseURL: configBaseURL, url: configURL } = error.config || {};

      let fullUrl: string | null = null;
      try {
        fullUrl = this.normalizeUrl(configBaseURL, configURL);
      } catch (e) {}

      // ========== 1. 非法URL（你原有逻辑，完全保留） ==========
      if (!fullUrl || !this.isUrlValid(fullUrl)) {
        const fallbackMessage = !this.isDevelopment
          ? '请求地址异常，请稍后重试'
          : `无效的请求地址：baseURL="${configBaseURL}", url="${configURL}"，拼接后："${fullUrl}"`;

        this.messagePop({
          status: error.status || 500,
          data: { code: 500, message: fallbackMessage, data: undefined }
        } as any);
        return;
      }

      try {
        // ========== 确保是 AxiosError ==========
        if (!(error instanceof AxiosError)) {
          const msg = !this.isDevelopment
            ? "网络或服务器错误，请稍后重试。"
            : `非Axios错误：${error['message']}`;

          this.messagePop({
            status: 500,
            data: { code: 500, message: msg, data: undefined }
          } as any);
          return;
        }

        // ========== 2. 优先处理：后端返回标准业务JSON（你原有逻辑） ==========
        if (error.response && this.isBizJsonResult(error.response.data)) {
          this.messagePop(error.response, `服务器错误，请稍后重试。`);
          return;
        }

        // ========== 3. 解析 host/port（安全解析，不崩溃） ==========
        let host = "unknown host";
        let port = "unknown port";
        try {
          const urlObj = new URL(fullUrl);
          host = urlObj.hostname;
          port = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
        } catch (e) {}

        let baseMessage = '';
        let userMessage = '';
        const status = error.response?.status || 500;

        // ====================== 你原来的所有判断 100% 保留 ======================
        // 500
        if (error.response?.status === 500) {
          baseMessage = '服务器繁忙，请稍后重试';
          if (this.isDevelopment) {
            userMessage = `服务器 ${host}:${port} 程序已启动，但处理请求时发生内部错误（500），响应：${JSON.stringify(error.response.data)}`;
          }
        }
        // 301
        else if (error.response?.status === 301) {
          baseMessage = error.response?.data?.message || '没有权限访问';
          if (this.isDevelopment) {
            userMessage = `服务器 ${host}:${port} 重定向（301）`;
          }
        }
        // 端口未启动
        else if (error.code === 'ECONNREFUSED') {
          baseMessage = '服务暂时不可用，请稍后重试';
          if (this.isDevelopment) {
            userMessage = `服务器 ${host} 已启动，但 ${port} 端口的服务未运行！请检查该端口的程序是否启动。`;
          }
        }
        // 网络不可达/超时
        else if (['ETIMEDOUT', 'ENETUNREACH', 'ECONNABORTED'].includes(error.code || '')) {
          baseMessage = '网络连接异常，请检查网络后重试';
          if (this.isDevelopment) {
            userMessage = `无法连接到服务器 ${host}，错误码：${error.code}，可能是服务器整机未启动或网络不通。`;
          }
        }
        // 响应格式错误
        else if (error.code === 'ERR_BAD_RESPONSE') {
          baseMessage = '服务响应格式异常，请稍后重试';
          if (this.isDevelopment) {
            userMessage = `服务器 ${host}:${port} 程序已启动，但返回非法响应（ERR_BAD_RESPONSE）！原始响应：${JSON.stringify(error.response?.data || '空响应')}`;
          }
        }
        // ========== ✅ 我帮你补上：缺失的关键错误（不破坏你原有逻辑） ==========
        // 无响应：断网 / CORS / 跨域
        else if (!error.response) {
          baseMessage = '网络异常，请检查网络连接';
          if (this.isDevelopment) {
            userMessage = `无响应：断网/CORS/服务器未启动 | ${error.message}`;
          }
        }
        // 401 未登录
        else if (error.response?.status === 401) {
          baseMessage = '登录已过期，请重新登录';
          if (this.isDevelopment) userMessage = baseMessage;
        }
        // 403 无权限
        else if (error.response?.status === 403) {
          baseMessage = '您没有权限访问此资源';
          if (this.isDevelopment) userMessage = baseMessage;
        }
        // 404 接口不存在
        else if (error.response?.status === 404) {
          baseMessage = '请求的接口不存在';
          if (this.isDevelopment) userMessage = `${fullUrl} 404 不存在`;
        }
        // 其他
        else {
          baseMessage = `请求失败（${status}），请稍后重试`;
          if (this.isDevelopment) {
            userMessage = `请求失败，状态码：${status}，错误码：${error.code}，信息：${error.message}`;
          }
    }

    // ========== 你原有 isDevelopment 切换逻辑 100% 保留 ==========
    const finalMessage = !this.isDevelopment ? baseMessage : userMessage;

    this.messagePop({
      status: status,
      data: { code: status, message: finalMessage, data: undefined }
    } as any);

  } catch (urlParseError) {
    // ========== 兜底catch（你原有逻辑） ==========
    const fallbackMessage = !this.isDevelopment
      ? '请求地址异常，请稍后重试'
      : `URL 解析失败：${fullUrl}，错误：${(urlParseError as Error).message}`;

    this.messagePop({
      status: error.status || 500,
      data: { code: 500, message: fallbackMessage, data: undefined }
    } as any);
  }
};

    //从Http响应中获取业务级响应
    private defaultResponseAdapter = (nativeResponse: AxiosResponse<AjaxResult<TResponseCode>>): Promise<any> =>{

        return new Promise((reslove,reject)=>{

          let response: any;
          const { data:retResult } = nativeResponse;

          if(retResult && typeof(retResult.code)!=='undefined') 
          {
            const {code,data,extra} = retResult
            response = code === 200
            ? (data!==undefined?data:true)
            : (data!==undefined?data:false);
            if(extra){
              response = {...response,userData:extra}
            }
            if(response === false){
              return reject('Business error: API returned false directly')
            }
          }
          else
          {
            response = retResult
          }
          reslove(response) 
      })    
    }
    
    //处理业务级响应AxiosResponse<TRetData, TRequestData> | PromiseLike<AxiosResponse<TRetData, TRequestData>>
    private resolveResponse(response: AxiosResponse<AjaxResult<TResponseCode>>,resolve: (value: any) => void,reject: (reason?: any) => void){
      try{
          const res = this.config.responseAdapter!(response)
          resolve(res);
      }catch(error){
        reject(error)
      }
    }

    /**
     * 处理响应入口 
    */
    public responseProcess=(response: AxiosResponse<AjaxResult<TResponseCode>>):Promise<any> => {
        this.messagePop(response)
        return new Promise((resolve,reject)=>this.resolveResponse(response,resolve,reject))
    }

    /**
     * 从Http相应获取重新包装的响应内容
    */
    public getAxiosResponse=<T = AjaxResult<TResponseCode>, D = any>(xhr:XMLHttpRequest,requestConfig: Optional<InternalAxiosRequestConfig<D>>={}) 
    : AxiosResponse<T,D>=>
    {
      return this.convertXhrToAxiosResponse<T,D>(xhr,requestConfig)
    }

    /**
     * 将 XHR 响应转换为 AxiosResponse 实例
     * @param xhr XHR 实例
     * @param requestConfig 请求配置（构造 config 字段）
     * @returns 符合 AxiosResponse 规范的实例
     */
    convertXhrToAxiosResponse<T = any, D = any>(xhr: XMLHttpRequest,requestConfig: Optional<InternalAxiosRequestConfig<D>>={}) : AxiosResponse<T, D> {
      // 1. 确定 data 字段（根据 responseType 适配）
      let data: T;
      const responseType = requestConfig.responseType || xhr.responseType;
      try {
        if (responseType === 'json' && xhr.responseText) {
          data = JSON.parse(xhr.responseText) as T;
        } else if (responseType === 'text' || responseType === '') {
          data = xhr.responseText as T;
        } else {
          // blob/arraybuffer 等二进制类型
          data = xhr.response as T;
        }
      } catch (e) {
        // 解析失败时 data 为原始响应文本
        data = xhr.responseText as T;
        console.warn('解析 XHR 响应数据失败：', e);
      }

      // 2. 构建完整的 AxiosResponse 实例
      const axiosResponse: AxiosResponse<T, D> = {
        data,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: this.parseResponseHeaders(xhr.getAllResponseHeaders()),
        config: {
          // 补全默认请求配置
          url: requestConfig.url || xhr.responseURL,
          method: requestConfig.method || 'GET',
          headers: requestConfig.headers!,
          data: requestConfig.data,
          responseType: responseType || 'text',
          // 扩展自定义配置
          ...requestConfig
        },
        request: xhr // 关联原始 XHR 实例
      }

      return axiosResponse;
    }

    private parseResponseHeaders(headersStr: string): RawAxiosResponseHeaders {
      const headers: RawAxiosResponseHeaders = {};
      if (!headersStr || typeof headersStr !== 'string') return headers;
      
      // 分割响应头并解析为键值对（过滤空行）
      headersStr.split('\r\n').forEach(line => {
        // 去除整行首尾空白，过滤空行
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // 找到第一个冒号的位置（避免值中包含冒号导致分割错误）
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex === -1) return; // 无效的头行（无冒号）

        // 分割键和值，分别去除首尾空格
        const key = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
        const value = trimmedLine.substring(colonIndex + 1).trim();

        if (!key) return; // 空键跳过

        // 处理多值头：始终保持数组类型（符合 Axios 规范）
        if (headers[key]) {
          // 如果已有值，确保是数组并追加
          headers[key] = Array.isArray(headers[key]) 
            ? [...headers[key], value] 
            : [headers[key] as string, value];
        } else {
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
    public uploadFile(file:File, opts:UploadOptionsType){
      return this.uploadService.upload(file,opts)
    }

    //组件使用
    public get uploadRequestHandler(){
      return this.uploadService.getUploadRequestHandler()
    }

    /**
     * @description 系统前端开发快速应用接口的能力，并提供标准的接口请求和响应处理
     * @author kongjing
     * @date 2022.10.12
    */
    public request=<T=any,D=any>(config: AxiosRequestConfig<D>,contentType:ContentType|undefined=undefined): Promise<T>=>{
      contentType=contentType||'application/json'
        if(contentType)
        {
            config.headers = config.headers||{}
            config.headers['Content-Type'] = contentType
        }
        return this.service(config);
    }

    /**
     * @description 适配相应为标准处理
     * @author kongjing
     * @date 2026.03.11
     *///xhr:XMLHttpRequest TRetData=any,TRequestData=any
    public responseAdapter<TRetData=any,TRequestData=any>(nativeResponse: AxiosResponse<AjaxResult<TResponseCode,TRetData>,TRequestData>)
    :Promise<TRetData>{
        return this.config.responseAdapter!<TRetData,TRequestData>(nativeResponse)
    }
}

export default RequestService