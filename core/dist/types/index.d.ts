import { AxiosRequestHeaders, AxiosResponse, AxiosResponseHeaders, RawAxiosRequestHeaders, RawAxiosResponseHeaders } from "axios";
import { FeedbackEnum } from "../enums/system";
export * from './contants';
export * from './upload';
export * from '../enums/account';
export * from '../enums/system';
export interface AxiosConfig<TResponseCode = number> {
    baseUrl: string;
    timeout: number;
    bigUploadApi: string;
    normalUploadApi: string;
    refreshTokenApi: string;
    useRefreshToken: boolean;
    nextDo: (type?: TResponseCode) => boolean;
    headerHook: (header: RawAxiosRequestHeaders | AxiosRequestHeaders | RawAxiosResponseHeaders | AxiosResponseHeaders) => void;
    signOut: () => void;
    saveToken: (token: string, refreshToken: string | undefined) => void;
    token: () => string;
    refreshToken: () => string;
    messageBox: (response: {
        status: number;
        code: TResponseCode;
        message: string;
    }) => void;
    chunkSize: number;
    uploadNotify: (e: {
        uid: string | number;
        message: string;
    }) => void;
    signOutWhen401And403Time?: number;
    unPackResponse?: <TRetData = any, TRequestData = any>(nativeResponse: AxiosResponse<AjaxResult<TResponseCode, TRetData>, TRequestData>) => TRetData;
    [key: string]: any;
}
/**
 * Content-Type常量定义
 */
export declare const ContentTypes: {
    readonly FORM_URLENCODED: "application/x-www-form-urlencoded";
    readonly MULTIPART_FORM_DATA: "multipart/form-data";
    readonly JSON: "application/json";
    readonly TEXT_PLAIN: "text/plain";
    readonly XML: "application/xml";
};
export type ContentType = typeof ContentTypes[keyof typeof ContentTypes];
/**
 * 登录响应
 */
export interface LoginResponse {
    tokenInfo: {
        tokenName: string;
        tokenValue: string;
        refreshToken: string;
    };
    userInfo: {
        id: String;
        loginName: string;
        userName: string;
        avatar: string;
        role: string[];
        gender: string;
    };
}
/**
 * 使对象指定属性变为可选
 */
export type PartialByKeys<T, K extends keyof T> = {
    [P in K]?: T[P];
} & Pick<T, Exclude<keyof T, K>>;
/**
 * 使对象指定属性全部变为可选
 */
export type Optional<T> = {
    [K in keyof T]?: T[K];
};
/**
 * @description axios 默认响应
*/
export interface AjaxResult<TResponseCode = number, T = any> {
    code: TResponseCode;
    message: string;
    data: T;
}
/**
 * @description 分页查询
*/
export interface PageInfo {
    /**
     * @description 页码
    */
    page: number;
    /**
     * @description 每页大小
     */
    pageSize: number;
}
/**
 * @description 基本查询条件的分页查询
*/
export type PageQuery<T = Record<string, any>> = {
    [P in keyof T]: T[P];
} & PageInfo & {
    keywords?: string;
};
/**
 * @description 分页数据-row数据类型
*/
export type PageResultItemData<T = Record<string, any>> = {
    [P in keyof T]: T[P];
};
/**
 * @description 分页数据-row数据类型
*/
export type TreePageResultItemData<T = Record<string, any>> = PageResultItemData<T> & {
    hasChildren: boolean;
    children: TreePageResultItemData<T>[];
    parent?: TreePageResultItemData<T>;
};
/**
 * @description 分页数据
*/
export interface PageResult<T> extends Omit<PageInfo, 'pageSize'> {
    /**
     * @description 总页数
    */
    pageCount: number;
    /**
     * @description 总条目数
    */
    total: number;
    /**
     * @description 当前页数据
    */
    rows: Array<PageResultItemData<T>>;
    /**
    * @description 是否还在加载中
   */
    loading: boolean;
}
/**
 * @description 树结构分页数据
*/
export interface TreePageResult<T> extends Omit<PageResult<T>, 'rows'> {
    rows: Array<TreePageResultItemData<T>>;
}
/**
 * 树数据结构
 */
export interface TreeNode {
    key: number | string;
    title: string;
    children?: Array<TreeNode>;
    parent?: TreeNode;
    description?: string;
}
/**
 * @description 拖拽元素位置
*/
export interface Position {
    x: number;
    y: number;
}
/**
 * @description 拖动时临时数据
*/
export interface MoveData<T = any> extends Position {
    offsetX: number;
    offsetY: number;
    source?: HTMLLIElement;
    data?: T;
}
/**
* @description 备选项列表
*/
export interface DefaultSelection<TValue, TSelection extends DefaultSelection<TValue, TSelection>> {
    label: string;
    value: TValue;
    isLeaf: boolean;
    children?: Array<TSelection>;
}
/**
* @description 备选项列表
*/
export interface SelectionOpt<TValue = string> extends DefaultSelection<TValue, SelectionOpt<TValue>> {
    parent: TValue;
}
/**
 * @description ajax 业务级操作时的返回类型
 */
export interface BusinessResult {
    /**
     * @description ajax 存在不可删除子级节点，询问是否需要删除，具体成功与失败取决于用户操作
    */
    feedback: FeedbackEnum;
    /**
     * @description ajax 业务相关消息
    */
    message: string;
}
//# sourceMappingURL=index.d.ts.map