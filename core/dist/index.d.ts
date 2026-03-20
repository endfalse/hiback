import { UploadService, RequestFactory } from './lib';
import { AxiosConfig, Optional } from './types';
import * as utils from './utils';
export { UploadService, RequestFactory, utils };
declare const _default: <TResponseCode = number>(axiosConfig: Optional<AxiosConfig<TResponseCode>>) => RequestFactory<TResponseCode>;
export default _default;
export * from './types';
//# sourceMappingURL=index.d.ts.map