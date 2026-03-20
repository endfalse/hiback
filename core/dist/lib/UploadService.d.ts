import RequestFactory from "./RequestService";
import { UploadRequestOptions, UploadedFile, UploadedImage, UploadedVideo, UploadOptionsType, UploadRequestHandler } from '../types';
export type ComplexUploaded = UploadedFile | UploadedImage | UploadedVideo;
/**
 * @description 文件上传服务
 * @author kongjing
 * @date 2026.03.13
*/
export default class UploadService<TResponseCode = number> {
    private requestFactoryInstance;
    private uploadNotify;
    private config;
    private uploadedChunks;
    constructor(requestFactoryInstance: RequestFactory<TResponseCode>);
    /**
     * @description 提供通用文件上传的封装
     * @author kongjing
     * @date 2026.03.13
     * */
    upload(file: File, opts: UploadOptionsType): Promise<ComplexUploaded | ComplexUploaded[] | undefined>;
    /**
    * @description 提供文件上传的封装，使用与el-plus和编辑器文件上传等配置
    * @author kongjing
    * @date 2026.03.13
    * */
    httpRequest(option: UploadRequestOptions & {
        chunk: boolean;
    }): Promise<UploadRequestHandler>;
    private getUploadId;
    private normalUpload;
    private uploadChunks;
    private uploadChunkWithRetry;
    private uploadChunk;
    /**
     * 检查单个response项是否满足返回undefined的条件
     * @param {any} item - 单个响应项
     * @returns {boolean} 是否满足条件
     */
    private checkSingleResponse;
    private getResponseData;
    private getUploadLoaded;
}
//# sourceMappingURL=UploadService.d.ts.map