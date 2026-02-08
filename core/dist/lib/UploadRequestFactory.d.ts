import { AxiosConfig, Optional } from "../types/index";
import { RequestOptionType, UploadRequestHandler } from "../types/upload";
declare class UploadRequestFactory<TResponseCode = number> {
    private chunkSize;
    private uploadNotify;
    private request;
    constructor(config: Optional<AxiosConfig<TResponseCode>>);
    create: (option: RequestOptionType) => Promise<UploadRequestHandler>;
    private getError;
    private isNil;
    private sliceFile;
    private nextProcess;
    private setHeaders;
    private uploadCore;
    /**
     * @description 提供文件上传的封装，使用与el-plus和编辑器文件上传等配置
     * @author kongjing
     * @date 2024.11.11
     * */
    private httpRequest;
}
export default UploadRequestFactory;
//# sourceMappingURL=UploadRequestFactory.d.ts.map