import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import kConfig from './kconfig';
import { UploadRequestFactory, RequestFactory, ProgressComputing } from './lib';
import { AjaxResult, AxiosConfig, ContentType, Optional } from './types';
import * as utils from './utils';
export { kConfig, UploadRequestFactory, RequestFactory, utils, ProgressComputing };
declare const _default: (axiosConfig: Optional<AxiosConfig>) => {
    getAxiosResponse: (xhr: XMLHttpRequest, config: InternalAxiosRequestConfig) => AxiosResponse<AjaxResult<any>, InternalAxiosRequestConfig<any>>;
    responseProcess: (response: AxiosResponse<AjaxResult>, unWrapResponseFn?: ((ajaxResult: AjaxResult) => any) | undefined) => Promise<any>;
    request: <T = any, D = any>(config: AxiosRequestConfig<D>, contentType?: ContentType) => Promise<T>;
};
export default _default;
export * from './types';
//# sourceMappingURL=index.d.ts.map