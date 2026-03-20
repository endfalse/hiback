import { UploadProgressEvent } from "../types";
/**
 * 获取文件的MD5
 *
*/
export declare const getFileMd5: (id: string, file: File, progress: (e: UploadProgressEvent) => void, useFileInfo?: boolean) => Promise<string>;
/**
 * 获取文件的MD5
 *
*/
export declare const getBlobMd5: (chunkBlob: Blob) => Promise<string>;
/**
* @description 精度控制
*/
export declare const precision: (f: number, digit: number) => number;
/**
* @description 防抖
*/
export declare const debounce: (fun: Function, span?: number) => (p?: any | undefined) => void;
/**
* @description 节流：控制有节奏的触发操作
*/
export declare const throttle: (fn: Function, interval?: number) => (...args: any) => void;
/**
 * 随机生成uuid
 *
*/
export declare const generateUUID: () => string;
/**
 * 获取文件大小的文本表达
 *
*/
export declare const formatFileSize: (bytes: number) => string;
export type FileType = 'doc' | 'ppt' | 'excel' | 'txt' | 'csv' | 'rar' | 'zip' | 'mp4';
/**
 * 判断是否是允许的文件类型
 *
*/
export declare const checkIsAllowFileType: (filetype: string, allowedTypes: FileType[]) => boolean;
//# sourceMappingURL=index.d.ts.map