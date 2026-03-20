import SparkMD5 from "spark-md5";
import { UploadProgressEvent } from "../types";

/**
 * 获取文件的MD5
 * 
*/
export const getFileMd5 = (
  id:string,
  file: File, 
  progress: (e: UploadProgressEvent) => void, 
  useFileInfo: boolean = false  // 新增参数，默认不使用文件信息生成
) => {
    return new Promise<string>((resolve, reject) => {

        // 如果指定使用文件信息生成MD5
        if (useFileInfo) {
            const spark = new SparkMD5()
            // 使用文件的基本信息生成MD5：名称、大小、最后修改时间
            spark.append(file.name)
            spark.append(String(file.size))
            spark.append(String(file.lastModified))
            progress({
                id,
                loaded:1,
                total:1,
                progress:100,
                message:'已获取到md5'
            })
            resolve(spark.end())
            return
        }

        // 否则按原逻辑读取文件内容生成MD5
        const spark = new SparkMD5.ArrayBuffer()
        const fileReader = new FileReader()
        const chunkSize = 1 * 1024 * 1024 // 1MB的块大小
        let chunksRead = 0
        const totalChunks = Math.ceil(file.size / chunkSize)
        
        progress({
            id,
            loaded:0,
            total:totalChunks,
            progress:0,
            message:'开始计算md5...'
        })

        const readNextChunk = () => {
            const start = chunksRead * chunkSize
            const end = Math.min(start + chunkSize, file.size)
            const blob = file.slice(start, end)
            fileReader.readAsArrayBuffer(blob)
        }
        
        fileReader.onload = function (event) {
            if (event.target && event.target.result instanceof ArrayBuffer) {
                spark.append(event.target.result)
                chunksRead++
                const pg = Math.floor((chunksRead / totalChunks) * 100)
                // 调用回调更新进度
                progress({
                    id,
                    loaded:chunksRead,
                    total:totalChunks,
                    progress: pg,
                    message:pg<100 ?'计算md5中':'计算完成'
                })
                
                if (chunksRead < totalChunks) {
                    readNextChunk();
                } else {
                    resolve(spark.end());
                }
            } else {
                resolve('');
            }
        };
        
        fileReader.onerror = function (error) {
            reject(error);
        };
        
        readNextChunk();
    });
};
    

/**
 * 获取文件的MD5
 * 
*/
export const getBlobMd5 = (
  chunkBlob: Blob
) => {
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    return new Promise<string>((resolve, reject) => {
        
        fileReader.readAsArrayBuffer(chunkBlob);
        fileReader.onload = function (event) {
            if (event.target && event.target.result instanceof ArrayBuffer) {
                spark.append(event.target.result);
                resolve(spark.end())
            } else {
                resolve('');
            }
        }

        fileReader.onerror = function (error) {
            reject(error);
        }
    })
}

/**
* @description 精度控制
*/
export const precision = function(f: number, digit: number) {
    const m = Math.pow(10, digit)
    return parseInt((f * m).toString(), 10) / m
}
/**
* @description 防抖
*/
export const debounce = (fun:Function, span = 500) => {
    let handler = 0
    return (p:any|undefined=undefined) => {
      handler && clearTimeout(handler)
      handler = window.setTimeout(() => {
        fun.apply(this, [p])
      }, span)
    }
}
/**
* @description 节流：控制有节奏的触发操作
*/
export const throttle = (fn: Function, interval = 500) => {
    let last: number;
    let timer: number;
    interval = interval || 200;
    return (...args: any) => {
        var now = +new Date();
        if (last && now - last < interval) {
            clearTimeout(timer);
            timer = window.setTimeout(() => {
                last = now;
                fn.apply(this, args);
            }, interval);
        } else {
            last = now;
            fn.apply(this, args);
        }
    }
}
/**
 * 随机生成uuid
 * 
*/
export const generateUUID = ()=>{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x'? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
/**
 * 获取文件大小的文本表达
 * 
*/
export const formatFileSize = (bytes: number): string  =>{
    if (bytes === 0) return '0 KB';
    const units = ['KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    const value = bytes.toFixed(2);
    const parts = value.split('.');
    if (parts.length > 1 && parts[1]?.match(/^0*$/)) {
      return parts[0] + ' ' + units[i];
    } else {
      return value + ' ' + units[i];
    }
}
export type FileType='doc'|'ppt'|'excel'|'txt'|'csv'|'rar'|'zip'|'mp4'
/**
 * 判断是否是允许的文件类型
 * 
*/
export const checkIsAllowFileType=(filetype: string, allowedTypes:FileType[])=> {
    const typeMap = {
        'doc': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
        'ppt': ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'],
        'excel': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        'txt': ['text/plain'],
        'csv': ['text/csv'],
        'rar': ['application/x-rar-compressed'],
        'zip': ['application/zip'],
        'mp4': ['video/mp4']
    };
    const relevantMimeTypes:string[] = [];
    allowedTypes.forEach(type => {
        relevantMimeTypes.push(...typeMap[type]);
    });
    return relevantMimeTypes.includes(filetype);
}