import Request from "./Request";
import Response from "./Response";
export default class Protocol<Req extends Request, Res extends Response> {

    private conf: PtlConf;
    constructor(conf: PtlConf) {
        this.conf = conf;
    }

    req: Req;
    res: Res;

    get url(): string {
        return this.conf.url;
    }

    get method(): string {
        return this.conf.method || 'GET';
    }

    get needLogin(): boolean {
        return Boolean(this.conf.needLogin);
    }

}


export interface PtlConf extends Object {
    /** Url应当跟协议名一致 不需要Ptl和"/"的前缀 */
    url: string;

    /** 仅允许GET或POST 默认为GET */
    method?: 'GET' | 'POST';

    /** 是否需要登录后才能使用 默认为false */
    needLogin?: boolean;
}