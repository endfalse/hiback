//import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import {UploadService,RequestFactory} from './lib'
import { AxiosConfig, Optional //,AjaxResult,ContentType, 

 } from './types'
import * as utils from './utils'
export {UploadService,RequestFactory,utils}

export default <TResponseCode=number>(axiosConfig:Optional<AxiosConfig<TResponseCode>>)=>{
    const facory = new RequestFactory<TResponseCode>(axiosConfig)
    // const getAxiosResponse= (xhr: XMLHttpRequest, config: InternalAxiosRequestConfig)=>{return facory.getAxiosResponse(xhr,config)}
    // const responseProcess= (response: AxiosResponse<AjaxResult<TResponseCode>>)=>{ return facory.responseProcess(response)}
    // const request=<T=any,D=any>(config: AxiosRequestConfig<D>,contentType:ContentType='application/json')=>{
    //     if(contentType)
    //     {
    //         config.headers = config.headers||{}
    //         config.headers['Content-Type'] = contentType
    //     }
    //     return facory.request<T,D>(config)
    // }
    //return {getAxiosResponse,responseProcess,request}
    return facory
}

export * from './types'