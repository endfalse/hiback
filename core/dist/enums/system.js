// 常用的contentTyp类型
export var ContentTypeEnum;
(function (ContentTypeEnum) {
    // json
    ContentTypeEnum["JSON"] = "application/json;charset=UTF-8";
    // text
    ContentTypeEnum["TEXT"] = "text/plain;charset=UTF-8";
    // xml
    ContentTypeEnum["XML"] = "application/xml;charset=UTF-8";
    // application/x-www-form-urlencoded 一般配合qs
    ContentTypeEnum["FORM_URLENCODED"] = "application/x-www-form-urlencoded;charset=UTF-8";
    // form-data  上传
    ContentTypeEnum["FORM_DATA"] = "multipart/form-data;charset=UTF-8";
})(ContentTypeEnum || (ContentTypeEnum = {}));
// /**
//  * @description 业务操作时的返回类型
// */
// export enum FeedbackEnum1{
//     /**
//      * 处理成功
//     */
//     success = 1002,
//     /**
//      * 处理失败
//     */
//     failure=1004,
//     /**
//      * 存在资源引用情况不可操作
//     */
//     hadReference=100401,
//     /**
//      * 存在子节点情况不可操作
//     */ 
//     hadChildren =100402
// }
/**
 * @description 国际化语言类型
*/
export var LocaleTypeEnum;
(function (LocaleTypeEnum) {
    /** 通用语言类型*/
    LocaleTypeEnum[LocaleTypeEnum["Common"] = 0] = "Common";
    /** 系统语言类型*/
    LocaleTypeEnum[LocaleTypeEnum["System"] = 1] = "System";
    /** 菜单语言类型*/
    LocaleTypeEnum[LocaleTypeEnum["Menu"] = 2] = "Menu";
    /**
     * 当前系统业务语言类型
     */
    LocaleTypeEnum[LocaleTypeEnum["Product"] = 3] = "Product";
})(LocaleTypeEnum || (LocaleTypeEnum = {}));
