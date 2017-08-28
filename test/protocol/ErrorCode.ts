enum ErrorCode {
    //成功，无错误
    SUCC = 0,

    //用户未登录
    ERR_NOT_LOGIN,

    //需要输入验证码
    ERR_NEED_CAPTCHA,

    //用户名或密码错误
    ERR_WRONG_USERNAME_PASSWD,

    //获取数据失败
    ERR_MONGO_FIND_ERR,

    //参数格式错误
    ERR_PARAM_FORMAT,

    //找不到数据
    ERROR_NO_RESULT,

    //参数类型错误
    ERROR_WRONG_TYPE,

    //参数错误
    ERROR_WRONG,

    //dailyAttention连接错误
    ERROR_DAILYATTENTION_CONNECT_ERROR,

    //panorama连接错误
    ERROR_PANORAMA_CONNECT_ERROR,

    //comment连接错误
    ERROR_COMMENT_CONNECT_ERROR,
        
    //数据格式错误
    ERROR_DATA_FORMAT_ERROR,

    //ID不能为空
    ERR_ID_NONULL
}
export default ErrorCode;