import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
//import kConfig from './kconfig'
import {UploadRequestFactory,RequestFactory,ProgressComputing} from './lib'
import { AjaxResult, AxiosConfig, ContentType, Optional } from './types'
import * as utils from './utils'
export {//kConfig,
    UploadRequestFactory,RequestFactory,utils,ProgressComputing}


export default <TResponseCode=number>(axiosConfig:Optional<AxiosConfig<TResponseCode>>)=>{
    const facory = new RequestFactory<TResponseCode>(axiosConfig)
    const getAxiosResponse= (xhr: XMLHttpRequest, config: InternalAxiosRequestConfig)=>{return facory.getAxiosResponse(xhr,config)}
    const responseProcess= (response: AxiosResponse<AjaxResult<TResponseCode>>)=>{ return facory.responseProcess(response)}
    const request=<T=any,D=any>(config: AxiosRequestConfig<D>,contentType:ContentType='application/json')=>{
        if(contentType)
        {
            config.headers = config.headers||{}
            config.headers['Content-Type'] = contentType
        }
        return facory.request<T,D>(config)
    }
    return {getAxiosResponse,responseProcess,request}
}

export * from './types'