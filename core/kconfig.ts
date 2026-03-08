import { AxiosConfig, Optional } from "./types"

const config:AxiosConfig={
    baseUrl:'https://j.jq123.net',
    timeout:3000,
    bigUploadApi:'https://j.jq123.net/file/uploadBig',
    normalUploadApi:'https://j.jq123.net/file',
    refreshTokenApi:'system/user/refreshToken',
    signOutWhen401And403Time:500,
    useRefreshToken:false,
    // nextDo:()=>{
    //     return false
    // },
    headerHook:()=>{
        console.debug("尚未实现kconfig.api.headerHook")
    },
    signOut:()=>{
        throw new Error("请实现此Hook->sinOut")
    },
    token:()=>{
        return '---token---'
      },
    refreshToken:()=>{
       return '---refreshToken---'
    },
    saveToken:()=>{
        throw new Error("请实现此Hook->saveToken")
    },
    uploadNotify:(e:{uid:string|number,message:string})=>{
        console.info('kconfig.uploadHook.uploadNotify->e:%o',e)
    },
    messageBox:()=>{
        throw new Error("kconfig.ts尚未实现:messageBox(type:'error'|'success'|'warning'|'info',message:string)")
    },
    chunkSize: 1024 * 1024 * 1,
    merge(options:Optional<AxiosConfig>){
        for(const key in options){
            this[key] = options[key]
        }
    }
}

export default config