export * from './upload';
export * from './typeTools';
/**
 * Content-Type常量定义
 */
export var ContentTypes = {
    // 表单默认编码类型，适用于大多数文本表单提交
    FORM_URLENCODED: 'application/x-www-form-urlencoded',
    // 用于文件上传或包含二进制数据的表单
    MULTIPART_FORM_DATA: 'multipart/form-data',
    // JSON格式提交，适用于API接口
    JSON: 'application/json',
    // 纯文本提交
    TEXT_PLAIN: 'text/plain',
    // XML格式提交
    XML: 'application/xml'
};
