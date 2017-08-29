import Response from "./Response";
import Request from "./Request";
import Protocol from "./Protocol";
/**
 * PtlUserLogin: 用户登录
 */
export default new Protocol<ReqUserCheck,ResUserCheck>({
    url: 'UserCheck',
    method: 'GET',
    needLogin: false
});

/**
 *
 */
export interface ReqUserCheck extends Request {

}

/**
 * accountStatus：账户状态
 * userId: 用户ID
 */
export interface ResUserCheck extends Response {
    accountStatus:string;
    userId:string;
}