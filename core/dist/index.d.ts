import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { UploadRequestFactory, RequestFactory, ProgressComputing } from './lib';
import { AjaxResult, AxiosConfig, ContentType, Optional } from './types';
import * as utils from './utils';
export { //kConfig,
UploadRequestFactory, RequestFactory, utils, ProgressComputing };
declare const _default: <TResponseCode = number>(axiosConfig: Optional<AxiosConfig<TResponseCode>>) => {
    getAxiosResponse: (xhr: XMLHttpRequest, config: InternalAxiosRequestConfig) => AxiosResponse<AjaxResult<TResponseCode, any>, InternalAxiosRequestConfig<any>>;
    responseProcess: (response: AxiosResponse<AjaxResult<TResponseCode>>) => Promise<any>;
    request: <T = any, D = any>(config: AxiosRequestConfig<D>, contentType?: ContentType) => Promise<T>;
};
export default _default;
export * from './types';
//# sourceMappingURL=index.d.ts.map