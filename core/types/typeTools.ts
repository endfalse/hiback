import { RawAxiosRequestHeaders } from "axios"

export type HibackRequestHeaders = RawAxiosRequestHeaders


//
//                             Record<string, string | Blob | [string | Blob, string]>,
export type HibackUploadData = Record<string, string | Blob | [string | Blob, string] | string[]>
/**
 * 获取实例方法返回值类型
 */
export type InstanceMethodReturnType<
  T, // 类的实例类型
  M extends keyof T // 方法名（约束为 T 的实例方法）
> = T[M] extends (...args: any[]) => infer R ? R : never;

/**
 * 使对象指定属性变为可选
 */
export type PartialByKeys<T, K extends keyof T> = {
	[P in K]?: T[P];
} & Pick<T, Exclude<keyof T, K>>

/**
 * 使对象指定属性全部变为可选
 */
export type Optional<T> = {
    [K in keyof T]?: T[K];
}