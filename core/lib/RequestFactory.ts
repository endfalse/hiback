import axios , { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { AjaxResultCode } from '../enums/system'
import { AjaxResult, AxiosConfig, Optional, RequestOptionType } from '../types'


class RequestFactory<TResponseCode=number>{
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

    private config:AxiosConfig<TResponseCode>

    private KCONFIG:AxiosConfig<TResponseCode>={
          baseUrl:'https://j.jq123.net',
          timeout:3000,
          bigUploadApi:'https://j.jq123.net/file/uploadBig',
          normalUploadApi:'https://j.jq123.net/file',
          refreshTokenApi:'system/user/refreshToken',
          signOutWhen401And403Time:500,
          useRefreshToken:false,
          nextDo:()=>{
              return false
          },
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

        this.config.unPackResponse = this.config.unPackResponse||this.pickBizResponse

        this.service = axios.create({baseURL: this.config.baseUrl,timeout:this.config.timeout})

        // 请求拦截器
        this.service.interceptors.request.use(
            this.defaultInterceptor,
            (error: AxiosError) => {return Promise.reject(error)}
        )
        // 响应拦截器
        this.service.interceptors.response.use(this.responseProcess,(error: AxiosError<AjaxResult<TResponseCode>>)=> {
              this.requests.isRefreshing=false
              if(this.config.useRefreshToken&&this.config.nextDo(error.response?.data?.code)){
                //无权限情况
                return this.processInvalidToken(error.response!)
              }

              // if(this.config.useRefreshToken&&error.response?.status === 401
              //   &&(error.response.data?.code as AjaxResultCode)===AjaxResultCode.InvalidToken){
              //   //无权限情况
              //   return this.processInvalidToken(error.response)
              // }
              this.showError(error)
              return Promise.reject(error)
        })
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
    private messagePop = (response: AxiosResponse<AjaxResult<TResponseCode>>)=>{
      // const message = response.data.message
      // if(response.status===200){
      //   message&&this.config.messageBox('success',message)
      // }
      // else{
      //   this.config.messageBox('error',message || '服务异常')
      // }
      this.config.messageBox({status:response.status,code:response.data.code,message:response.data.message})
    }

    private isBizJsonResult(ajaxResult: any): ajaxResult is AjaxResult {
      return ajaxResult && typeof ajaxResult === 'object' && 'code' in ajaxResult
    }
    
    // 错误处理
    private showError=(error: AxiosError<AjaxResult<TResponseCode>> | AxiosResponse<AjaxResult<TResponseCode>>) =>{
      if(error instanceof AxiosError)
      {
        if(this.isBizJsonResult(error.response?.data)){
          this.messagePop(error.response)
        }
        else{
          const badMessage: any = error.message || error
          this.messagePop({
            status:error.status||500,
            data:{code:500,message:badMessage || '服务异常',data:undefined}
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
        this.messagePop(error)
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
    private pickBizResponse = (nativeResponse: AxiosResponse<AjaxResult<TResponseCode>>): any =>{
      // ddd
        // if(nativeResponse.data.feedback){
        //   return nativeResponse.data
        // }
        // if (typeof nativeResponse.data === "undefined") {
        //   nativeResponse.data = {};
        // }
      
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
      resolve(this.config.unPackResponse!(response));
    }

    //处理令牌过期问题
    private processInvalidToken=(response: AxiosResponse<AjaxResult<TResponseCode>>)=>{
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
    public responseProcess=(response: AxiosResponse<AjaxResult<TResponseCode>>):Promise<any> => {
        //const {code:bizCode} = response.data
        //兼容旧版本无权限情况//
        // if(bizCode===AjaxResultCode.InvalidToken){
        //   return this.processInvalidToken(response)
        // }
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