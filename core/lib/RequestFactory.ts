import axios , { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { AjaxResultCode } from '../enums/system'
import { AjaxResult, AxiosConfig, Optional, RequestOptionType } from '../types'
import kconfig from '../kconfig'
class RequestFactory{
    private service: AxiosInstance
    private requests= {
      isRefreshing:false,
      listing:[] as ((token:string)=>void)[],
      retry:0,
      newToken:''
    }
    private get defaultInterceptor() {
        return (config: InternalAxiosRequestConfig<any>)=>{
            this.config.headerHook(config.headers)
            config.headers = config.headers||{}

            // JWT鉴权处理
            if(this.requests.isRefreshing){
              if(this.requests.newToken){
                config.headers.Authorization=`Bearer ${this.requests.newToken}`
              }
              else
              {
                //如果在刷新令牌时不需要设置jwt头
                delete config.headers.Authorization
              }
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
    private config:AxiosConfig

    constructor(config:Optional<AxiosConfig>){
        this.config = kconfig
        for(const key in config){
          config[key]&&(this.config[key]=config[key])
        }

        this.config.unPackResponse = this.config.unPackResponse||this.pickBizResponse

        this.service = axios.create({baseURL: this.config.baseUrl,timeout:this.config.timeout})

        const useTokenRefresh=typeof(this.config.refreshToken())==='string'&&this.config.refreshToken()!==''
        // 请求拦截器
        this.service.interceptors.request.use(
            this.defaultInterceptor,
            (error: AxiosError) => {return Promise.reject(error)}
        )
        // 响应拦截器
        this.service.interceptors.response.use(
            this.responseProcess,
            (error: AxiosError<AjaxResult>)=> {
              this.requests.isRefreshing=false
              if(useTokenRefresh&&error.response?.status === 401&&(error.response.data?.code as AjaxResultCode)===AjaxResultCode.InvalidToken){
                //无权限情况
                return this.processInvalidToken(error.response)
              }
              this.showError(error)
              return Promise.reject(error)
            }
        )
    }

    public get axiosConfig() {
        return this.config
    }
    

    private resetRequests(loginOut:boolean=false,reason:any|undefined=undefined){
          this.requests.listing=[],
          this.requests.isRefreshing =false,
          this.requests.retry=0
          this.requests.newToken=''
          if(loginOut)
          {
              this.config.signOut()
          }
          if(reason)
          {
              Promise.reject(reason)
          }
    }
    private refreshToken = ()=>{
        if(this.requests.retry>0){
            throw new Error('refresh token is invalid')
        }
        return this.request<{token:string,refreshToken:string}>({
          url: this.config.refreshTokenApi,
          method: 'post',
          data:{refreshToken:this.config.refreshToken()},
          headers:{'Content-Type':'application/x-www-form-urlencoded'},
        })
    }
    
    //处理UI级消息相应
    private messagePop = (ajaxResult: AjaxResult)=>{
      if (typeof(ajaxResult.code)==='number'&& ajaxResult.message) {
        const {code,message} = ajaxResult
        switch (code) {
          case AjaxResultCode.Error:
              this.config.messageBox('error',message || '服务异常')
            break;
          case AjaxResultCode.Fail:
          case AjaxResultCode.Warning:
              this.config.messageBox('warning',message || '服务异常')
            break;
          case AjaxResultCode.None:
            message&&this.config.messageBox('info',message)
            break;
          case AjaxResultCode.Success:
            message&&this.config.messageBox('success',message)
            break;
          default:
              this.config.messageBox('error',message || `未能识别code:${code}，请检查接口`)
            break;
        }
      }
    }

    private isBizJsonResult(ajaxResult: any): ajaxResult is AjaxResult {
      return ajaxResult && typeof ajaxResult === 'object' && 'code' in ajaxResult
    }
    
    // 错误处理
    private showError=(error: AxiosError | AxiosResponse<AjaxResult>) =>{
      if(error instanceof AxiosError)
      {
        if(this.isBizJsonResult(error.response?.data)){
          this.messagePop(error.response.data)
        }
        else{
          const badMessage: any = error.message || error
          this.config.messageBox('error',badMessage || '服务异常')
        }
        // token过期，清除本地数据，并跳转至登录页面
        if (error.status === 403||error.status === 401) {
          setTimeout(() => {
            this.config.signOut()
          },this.config.signOutWhen401And403Time||500);
        }
     }
     else{
        this.messagePop(error.data)
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
    private pickBizResponse = (nativeResponse: AxiosResponse): any =>{
        if(nativeResponse.data.feedback){
          return nativeResponse.data
        }
      
        if (typeof nativeResponse.data === "undefined") {
          nativeResponse.data = {};
        }
      
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
    private resolveResponse(response: AxiosResponse,resolve: (value: any) => void){
      resolve(this.config.unPackResponse!(response));
    }

    //处理令牌过期问题
    private processInvalidToken=(response: AxiosResponse)=>{
      if(!this.requests.isRefreshing)
      {
        this.requests.isRefreshing=true
        return new Promise(resolve=>{
          this.refreshToken().then(async tokens=>{
            const {token,refreshToken} = tokens
              if (token&&refreshToken) {
                //保存新的令牌
                this.config.saveToken(token,refreshToken)
                this.requests.newToken = token
                //获取上次的请求重新发送并获取结果
                const newret =  await this.request(response.config)
                //处理token过期时请求需要的响应
                resolve(newret)
                //检查过期后同时发送的其他请求，并根据新的token重新发送请求
                this.requests.listing.forEach((cb) => cb(token))
                //清除请求队列
                this.resetRequests()
              }
              else {
                throw new Error('refresh token is invalid')
              }
          }).catch(reason=>{
            this.resetRequests(true,reason)
          })
        }).finally(()=>{
          this.requests.isRefreshing=false
        }) 
      }
      return new Promise<any>(_=>{
        this.requests.listing.push(_=>{
          this.request(response.config)
        })
      })
    } 

    //处理响应入口 
    public responseProcess=(response: AxiosResponse):Promise<any> => {
        const {code:bizCode} = response.data
        //兼容旧版本无权限情况
        if(bizCode===AjaxResultCode.InvalidToken){
          return this.processInvalidToken(response)
        }
        this.messagePop(response.data)
        return new Promise(resolve=>this.resolveResponse(response,resolve))
    }

    //从Http相应获取重新包装的响应内容
    public getAxiosResponse=(xhr:XMLHttpRequest,config:InternalAxiosRequestConfig|RequestOptionType) : AxiosResponse<AjaxResult,InternalAxiosRequestConfig>=>
    {
      return {
        data: this.getBody(xhr) as AjaxResult,
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