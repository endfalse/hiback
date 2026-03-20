//import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { UploadService, RequestFactory } from './lib';
import * as utils from './utils';
export { UploadService, RequestFactory, utils };
export default (function (axiosConfig) {
    var facory = new RequestFactory(axiosConfig);
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
    return facory;
});
export * from './types';
