import Response from "./Response";
import Request from "./Request";
import Protocol from "./Protocol";
/**
 * Demo: HTTP JSON API请求协议
 * 协议名就是文件名 统一Ptl开头
 * 全部通过 new Protocol<Request, Response>( Conf ) 来定义
 */
export default new Protocol<ReqDemo,any>({
    url: 'Demo',
    method: 'GET',
    needLogin: false
})

export interface ReqDemo extends Request {
    paramA:string;
    paramB: number;
    paramC :'value1' | 'valueB';
    paramD: { a: string, b: string } | undefined;
    paramD1 ? : undefined | boolean[]
    paramE ? : {[key: string]: number}
    paramF ? : {[key: number]: string[]}
}


export interface ResDemo extends Response {
    paramA : string;
    paramB:number;
    paramC:   'value1' | 'valueB';
    paramD  ?  :  { a : string  , b :   string  }
}