import kConfig from './kconfig';
import { UploadRequestFactory, RequestFactory, ProgressComputing } from './lib';
import * as utils from './utils';
export { kConfig, UploadRequestFactory, RequestFactory, utils, ProgressComputing };
export default (function (axiosConfig) {
    var facory = new RequestFactory(axiosConfig);
    var getAxiosResponse = function (xhr, config) { return facory.getAxiosResponse(xhr, config); };
    var responseProcess = function (response, unWrapResponseFn) { return facory.responseProcess(response, unWrapResponseFn); };
    var request = function (config, contentType) {
        if (contentType === void 0) { contentType = 'application/json'; }
        if (contentType) {
            config.headers = config.headers || {};
            config.headers['Content-Type'] = contentType;
        }
        return facory.request(config);
    };
    return { getAxiosResponse: getAxiosResponse, responseProcess: responseProcess, request: request };
});
export * from './types';
