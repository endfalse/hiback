
import { UploadService,RequestFactory } from './lib'
import { AxiosConfig, Optional } from './types'
import * as utils from './utils'
export {UploadService,RequestFactory,utils}

export default <TResponseCode=number>(axiosConfig:Optional<AxiosConfig<TResponseCode>>)=>{
    const facory = new RequestFactory<TResponseCode>(axiosConfig)
    return facory
}

export * from './types'