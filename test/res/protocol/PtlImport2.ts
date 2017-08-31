import Response from "./Response"
import Request from "./Request"
import Protocol from "./Protocol"
import {
    ImportInput,
    ImportInput2
}
    from
    './subfolder/ImportInput'
    
/**
 * Demo: HTTP JSON API请求协议
 * 协议名就是文件名 统一Ptl开头
 * 全部通过 new Protocol<Request, Response>( Conf ) 来定义
 */
export default new Protocol<ReqImport,any>({
    url: 'Import',
    method: 'GET',
    needLogin: false
})

export interface ReqImport extends Request {
    input: ImportInput;
    input2: ImportInput2
}


export interface ResImport extends Response {

}