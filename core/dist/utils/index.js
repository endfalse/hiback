var _this = this;
import SparkMD5 from "spark-md5";
/**
 * 获取文件的MD5
 *
*/
export var getFileMd5 = function (id, file, progress, useFileInfo // 新增参数，默认不使用文件信息生成
) {
    if (useFileInfo === void 0) { useFileInfo = false; }
    return new Promise(function (resolve, reject) {
        // 如果指定使用文件信息生成MD5
        if (useFileInfo) {
            var spark_1 = new SparkMD5();
            // 使用文件的基本信息生成MD5：名称、大小、最后修改时间
            spark_1.append(file.name);
            spark_1.append(String(file.size));
            spark_1.append(String(file.lastModified));
            progress({
                id: id,
                loaded: 1,
                total: 1,
                progress: 100,
                message: '已获取到md5'
            });
            resolve(spark_1.end());
            return;
        }
        // 否则按原逻辑读取文件内容生成MD5
        var spark = new SparkMD5.ArrayBuffer();
        var fileReader = new FileReader();
        var chunkSize = 1 * 1024 * 1024; // 1MB的块大小
        var chunksRead = 0;
        var totalChunks = Math.ceil(file.size / chunkSize);
        progress({
            id: id,
            loaded: 0,
            total: totalChunks,
            progress: 0,
            message: '开始计算md5...'
        });
        var readNextChunk = function () {
            var start = chunksRead * chunkSize;
            var end = Math.min(start + chunkSize, file.size);
            var blob = file.slice(start, end);
            fileReader.readAsArrayBuffer(blob);
        };
        fileReader.onload = function (event) {
            if (event.target && event.target.result instanceof ArrayBuffer) {
                spark.append(event.target.result);
                chunksRead++;
                var pg = Math.floor((chunksRead / totalChunks) * 100);
                // 调用回调更新进度
                progress({
                    id: id,
                    loaded: chunksRead,
                    total: totalChunks,
                    progress: pg,
                    message: pg < 100 ? '计算md5中' : '计算完成'
                });
                if (chunksRead < totalChunks) {
                    readNextChunk();
                }
                else {
                    resolve(spark.end());
                }
            }
            else {
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
export var getBlobMd5 = function (chunkBlob) {
    var spark = new SparkMD5.ArrayBuffer();
    var fileReader = new FileReader();
    return new Promise(function (resolve, reject) {
        fileReader.readAsArrayBuffer(chunkBlob);
        fileReader.onload = function (event) {
            if (event.target && event.target.result instanceof ArrayBuffer) {
                spark.append(event.target.result);
                resolve(spark.end());
            }
            else {
                resolve('');
            }
        };
        fileReader.onerror = function (error) {
            reject(error);
        };
    });
};
/**
* @description 精度控制
*/
export var precision = function (f, digit) {
    var m = Math.pow(10, digit);
    return parseInt((f * m).toString(), 10) / m;
};
/**
* @description 防抖
*/
export var debounce = function (fun, span) {
    if (span === void 0) { span = 500; }
    var handler = 0;
    return function (p) {
        if (p === void 0) { p = undefined; }
        handler && clearTimeout(handler);
        handler = window.setTimeout(function () {
            fun.apply(_this, [p]);
        }, span);
    };
};
/**
* @description 节流：控制有节奏的触发操作
*/
export var throttle = function (fn, interval) {
    if (interval === void 0) { interval = 500; }
    var last;
    var timer;
    interval = interval || 200;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var now = +new Date();
        if (last && now - last < interval) {
            clearTimeout(timer);
            timer = window.setTimeout(function () {
                last = now;
                fn.apply(_this, args);
            }, interval);
        }
        else {
            last = now;
            fn.apply(_this, args);
        }
    };
};
/**
 * 随机生成uuid
 *
*/
export var generateUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
/**
 * 获取文件大小的文本表达
 *
*/
export var formatFileSize = function (bytes) {
    var _a;
    if (bytes === 0)
        return '0 KB';
    var units = ['KB', 'MB', 'GB', 'TB'];
    var i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    var value = bytes.toFixed(2);
    var parts = value.split('.');
    if (parts.length > 1 && ((_a = parts[1]) === null || _a === void 0 ? void 0 : _a.match(/^0*$/))) {
        return parts[0] + ' ' + units[i];
    }
    else {
        return value + ' ' + units[i];
    }
};
/**
 * 判断是否是允许的文件类型
 *
*/
export var checkIsAllowFileType = function (filetype, allowedTypes) {
    var typeMap = {
        'doc': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
        'ppt': ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'],
        'excel': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        'txt': ['text/plain'],
        'csv': ['text/csv'],
        'rar': ['application/x-rar-compressed'],
        'zip': ['application/zip'],
        'mp4': ['video/mp4']
    };
    var relevantMimeTypes = [];
    allowedTypes.forEach(function (type) {
        relevantMimeTypes.push.apply(relevantMimeTypes, typeMap[type]);
    });
    return relevantMimeTypes.includes(filetype);
};
