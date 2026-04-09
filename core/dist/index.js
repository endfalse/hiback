import { UploadService, RequestFactory } from './lib';
import * as utils from './utils';
export { UploadService, RequestFactory, utils };
export default (axiosConfig) => {
    const facory = new RequestFactory(axiosConfig);
    return facory;
};
export * from './types';
