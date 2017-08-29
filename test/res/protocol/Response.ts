interface Response {
    errcode?:number;    //0代表成功 否则为相应错误码
    errmsg?:string;   //错误时返回错误信息（中文）
}
export default Response;