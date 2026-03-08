import axios , { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { AjaxResultCode } from '../enums/system'
import { AjaxResult, AxiosConfig, Optional, RequestOptionType } from '../types'
import TokenRequestHandler from './TokenRequestHandler'

const isProduction = process.env['NODE_ENV'] === 'production';
class RequestFactory<TResponseCode=number>{
    private service: AxiosInstance
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

    private config:AxiosConfig<TResponseCode>

    private KCONFIG:AxiosConfig<TResponseCode>={
          baseUrl:'https://j.jq123.net',
          timeout:3000,
          bigUploadApi:'https://j.jq123.net/file/uploadBig',
          normalUploadApi:'https://j.jq123.net/file',
          refreshTokenApi:'system/user/refreshToken',
          signOutWhen401And403Time:500,
          useRefreshToken:false,
          // nextDo:()=>{
          //     return false
          // },
          headerHook:()=>{
              console.debug("尚未实现kconfig.api.headerHook")
          },
          signOut:()=>{
              throw new Error("请实现此Hook->sinOut")
          },
          token:()=>{
              return '---token---'
          },
          refreshToken:()=>{
            return '---refreshToken---'
          },
          saveToken:()=>{
              throw new Error("请实现此Hook->saveToken")
          },
          uploadNotify:(e:{uid:string|number,message:string})=>{
              console.info('kconfig.uploadHook.uploadNotify->e:%o',e)
          },
          messageBox:()=>{
              throw new Error("kconfig.ts尚未实现:messageBox(type:'error'|'success'|'warning'|'info',message:string)")
          },
          chunkSize: 1024 * 1024 * 1,
          merge(options:Optional<AxiosConfig>){
              for(const key in options){
                  this[key] = options[key]
              }
          }
    }

    constructor(config:Optional<AxiosConfig<TResponseCode>>){
        this.config = this.KCONFIG
        for(const key in config){
          config[key]&&(this.config[key]=config[key])
        }

        this.config.responseAdapter = this.config.responseAdapter||this.defaultResponseAdapter

        this.service = axios.create({baseURL: this.config.baseUrl,timeout:this.config.timeout})

        this.config.tokenRequestHandler =new TokenRequestHandler({
            useRefreshToken: this.config.useRefreshToken,
            isTokenExpired: (response) => {
              return response.status === 401 && response.data?.code === 10001;
            },
            refreshToken: async () => {
              const refreshToken = this.config.refreshToken();
              if (!refreshToken) throw new Error('无刷新令牌');
              const res = await this.service.post(this.config.refreshTokenApi, { refreshToken });
              if (res.data.code !== 200) throw new Error(res.data.msg || '刷新失败');
              this.config.saveToken(res.data.data.token,res.data.data.refreshToken)
            },
            getLatestToken: () => {
              return this.config.token()
            }
        })

        // 请求拦截器
        this.service.interceptors.request.use(this.defaultInterceptor,(error: AxiosError) => {return Promise.reject(error)})

        // 响应拦截器
        this.service.interceptors.response.use(this.responseProcess,(error: AxiosError<AjaxResult<TResponseCode>>)=> {
              return this.config.tokenRequestHandler?.handleRequestError(error,()=>{
                this.showError(error)
              })
        })
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
    private showError=(error: AxiosError<AjaxResult<TResponseCode>> | AxiosResponse<AjaxResult<TResponseCode>>) =>{
      const {baseURL:configBaseURL,url:configURL} = error.config||{}
      // 1. 拼接 URL 并校验合法性
      let fullUrl = this.normalizeUrl(configBaseURL,configURL);
      // 2. 优先处理非法 URL 场景
      if (!fullUrl||!this.isUrlValid(fullUrl)) {
        const fallbackMessage = isProduction
          ? '请求地址异常，请稍后重试'
          : `无效的请求地址：baseURL="${error.config?.baseURL}", url="${error.config?.url}"，拼接后："${fullUrl}"`;
         this.messagePop({
              status:error.status||500,
              data:{code:500,message:fallbackMessage,data:undefined}
        } as any)
      }
      try{
        if(error instanceof AxiosError)
        {
          if(this.isBizJsonResult(error.response?.data)){
            this.messagePop(error.response,`服务器错误，请稍后重试。`)
          }
          else{
            const urlObj = new URL(fullUrl)
            const host = urlObj.hostname;
            const port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);

            let baseMessage = ''
            let userMessage = ''
            // ========== 1. 端口程序未启动（核心场景） ==========
            if (error.code === 'ECONNREFUSED') {
              baseMessage = '服务暂时不可用，请稍后重试';
              if (!isProduction) {
                // 精准提示：服务器启动但端口程序关闭
                userMessage = `服务器 ${host} 已启动，但 ${port} 端口的服务未运行！请检查该端口的程序是否启动。`;
              }
            }
            // ========== 2. 服务器连接超时/不可达 ==========
            else if (['ETIMEDOUT', 'ENETUNREACH', 'ECONNABORTED'].includes(error.code||'')) {
              baseMessage = '网络连接异常，请检查网络后重试';
              if (!isProduction) {
                userMessage = `无法连接到服务器 ${host}，错误码：${error.code}，可能是服务器整机未启动或网络不通。`;
              }
            }
            // ========== 3. 响应格式异常（ERR_BAD_RESPONSE） ==========
            else if (error.code === 'ERR_BAD_RESPONSE') {
              baseMessage = '服务响应格式异常，请稍后重试';
              if (!isProduction) {
                // 仅提示「程序已启动但响应异常」，排除端口未启动的误导
                userMessage = `服务器 ${host}:${port} 程序已启动，但返回非法响应（ERR_BAD_RESPONSE）！可能是响应格式错误/空响应，原始响应：${JSON.stringify(error.response?.data || '空响应')}`;
              }
            }
            // ========== 4. 服务器内部错误（500） ==========
            else if (error.response?.status === 500) {
              baseMessage = '服务器繁忙，请稍后重试';
              if (!isProduction) {
                userMessage = `服务器 ${host}:${port} 程序已启动，但处理请求时发生内部错误（500），响应：${JSON.stringify(error.response.data)}`;
              }
            }
            // ========== 5. 其他错误 ==========
            else {
              const status = error.response?.status || '未知';
              baseMessage = `请求失败（${status}），请稍后重试`;
              if (!isProduction) {
                userMessage = `请求失败，状态码：${status}，错误码：${error.code}，信息：${error.message}`;
              }
            }
            const badMessage = isProduction?baseMessage:userMessage
            this.messagePop({
              status:error.status||500,
              data:{code:500,message:badMessage,data:undefined}
            } as any)
          }
          // token过期，清除本地数据，并跳转至登录页面
          if (error.status === 403||error.status === 401) {
            setTimeout(() => {
              this.config.signOut()
            },this.config.signOutWhen401And403Time||300);
          }
        }
        else{
            this.messagePop(error,"网络或服务器错误，请稍后重试。")
        }
      }
      catch (urlParseError) {
        // 兜底：极端情况（校验通过但解析失败）
        const fallbackMessage = isProduction
          ? '请求地址异常，请稍后重试'
          : `URL 解析失败：${fullUrl}，错误：${(urlParseError as Error).message}`;
        this.messagePop({
              status:error.status||500,
              data:{code:500,message:fallbackMessage,data:undefined}
        } as any)
      }
    }

    //获取响应体数据
    private getBody=(xhr: XMLHttpRequest): AjaxResult|XMLHttpRequestResponseType => {
        const text = xhr.responseText || xhr.response
        if (!text) {
        return text as XMLHttpRequestResponseType
        }
        try {
        return JSON.parse(text) as AjaxResult
        } catch {
        return text as  XMLHttpRequestResponseType
        }
    }
    
    //从Http响应中获取业务级响应
    private defaultResponseAdapter = (nativeResponse: AxiosResponse<AjaxResult<TResponseCode>>): any =>{

        let response: any;
        const { data:retResult } = nativeResponse;
      
        if(retResult && typeof(retResult.code)!=='undefined') 
        {
          response =retResult.code === AjaxResultCode.Success
          ? (retResult.data!==undefined?retResult.data:true)
          : (retResult.data!==undefined?retResult.data:false);
        }
        else
        {
          response = retResult
        }
        return response     
    }
    
    //处理业务级响应AxiosResponse<TRetData, TRequestData> | PromiseLike<AxiosResponse<TRetData, TRequestData>>
    private resolveResponse(response: AxiosResponse<AjaxResult<TResponseCode>>,resolve: (value: any) => void){
      resolve(this.config.responseAdapter!(response));
    }

    //处理响应入口 
    public responseProcess=(response: AxiosResponse<AjaxResult<TResponseCode>>):Promise<any> => {
        this.messagePop(response)
        return new Promise(resolve=>this.resolveResponse(response,resolve))
    }

    //从Http相应获取重新包装的响应内容
    public getAxiosResponse=(xhr:XMLHttpRequest,config:InternalAxiosRequestConfig|RequestOptionType) : AxiosResponse<AjaxResult<TResponseCode>,InternalAxiosRequestConfig>=>
    {
      return {
        data: this.getBody(xhr) as AjaxResult<TResponseCode>,
        status: xhr.status,
        statusText: xhr.statusText,
        headers:config.headers!,
        config:config as any,
        request: xhr,
      }
    }

    public get bigUploadApi(){
        return this.config.bigUploadApi
    }

    public get normalUploadApi(){
        return this.config.normalUploadApi
    }
    
    /**
     * @description 系统前端开发快速应用接口的能力，并提供标准的接口请求和响应处理
     * @author kongjing
     * @date 2022.10.12
     */
    public request=<T=any,D=any>(config: AxiosRequestConfig<D>): Promise<T>=>{
        return this.service(config);
    }
}

export default RequestFactory