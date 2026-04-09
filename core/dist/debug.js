"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalDebug = void 0;
exports.setDebug = setDebug;
// 全局调试开关（整个库共享）
exports.globalDebug = false;
// 提供给外部开启/关闭调试
function setDebug(enable) {
    exports.globalDebug = enable;
}
