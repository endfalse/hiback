import { AxiosConfig, Optional } from "./types"

const config:AxiosConfig={
    baseUrl:'/',
    timeout:0,
    refreshTokenApi:'system/user/refreshToken',
    signOutWhen401And403Time:500,
    useRefreshToken:false,
    debug:true,
    fileUpload:{
        api:'upload',
        chunkSize:1 * 1024 * 1024,
        batchSize: 12,
        maxRetries:3,
        retryDelay:1000
    },

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
    messageBox:()=>{
        throw new Error("kconfig.ts尚未实现:messageBox(type:'error'|'success'|'warning'|'info',message:string)")
    },
    // merge(options:Optional<AxiosConfig>){
    //     for(const key in options){
    //         this[key] = options[key]
    //     }
    // }
}

export default config