export enum ValidateErrorCode{
    Succ = 0,
    NullOnRequired,
    LogicFalse,
    NotArray,
    NotNumber,
    NotString,
    NotBoolean,
    NotObject,
    NotNull,
    NotUndefined,
    InvalidStrLiteral,
    ArrayNotMatch,
    InterfaceNotMatch,
    FieldNotAllowed
}

/**
 * errcode为0表示成功
 */
export default class ValidateResult{
    errcode: ValidateErrorCode;
    /**
     * 若是InterfaceValidator或ArrayValidator，则此字段标识错误发生在哪个子字段
     */
    fieldName: string | undefined | null;
    /**
     * 子字段的错误详情
     * errcode指整体的错误码， fieldName指若是错误从子元素发出，那么发生在哪个子元素，innerError指具体子元素发出的错误
     * 如有
     *    {
     *      a: {
     *          b:{
     *              c: number
     *          }
     *      }
     *    }
     * 对于 {a:{b:{c:"Wrong"}}}, 验证结果为：
     * {
     *    errcode: InterfaceNotMatch,
     *    fieldName: a,
     *    innerError: {
     *          errcode: InterfaceNotMatch,
     *          field: b,
     *          innerError: {
     *              errcode: BasicTypeNotMatch,
     *              fieldName: c
     *          }
     *    }
     * }
     */
    innerError: ValidateResult | undefined | null;

    private static ErrorMessages = {
        [ValidateErrorCode.Succ]: '验证通过',
        [ValidateErrorCode.NullOnRequired]: '该字段不能为空',
        [ValidateErrorCode.LogicFalse]: '字段类型不满足条件',
        [ValidateErrorCode.NotArray]: '该字段必须是数组',
        [ValidateErrorCode.NotNumber]: '该字段必须是数字',
        [ValidateErrorCode.NotString]: '该字段必须是字符串',
        [ValidateErrorCode.NotBoolean]: '该字段必须是布尔值',
        [ValidateErrorCode.NotObject]: '该字段必须是Object',
        [ValidateErrorCode.NotNull]: '该字段必须是null',
        [ValidateErrorCode.NotUndefined]: '该字段必须是undefined',
        [ValidateErrorCode.InvalidStrLiteral]: '不合法的值',
        [ValidateErrorCode.ArrayNotMatch]: '数组元素类型错误',
        [ValidateErrorCode.InterfaceNotMatch]: '数据类型错误',
        [ValidateErrorCode.FieldNotAllowed]: '不允许出现的字段'
    };

    //重载检测 fieldName和innerError要传必须一起
    constructor(errcode:ValidateErrorCode);
    constructor(errcode:ValidateErrorCode, fieldName: string, innerError:ValidateResult);
    constructor(errcode:ValidateErrorCode=0, fieldName?: string, innerError?: ValidateResult){
        if(fieldName&&!innerError || !fieldName&&innerError){
            throw new Error('fieldName和innerError必须同时出现');
        }

        this.errcode = errcode;
        this.fieldName = fieldName;
        this.innerError = innerError;

        if((this.fieldName && this.innerError==null)
            || (this.fieldName==null && this.innerError)){
            console.error('fieldName', fieldName);
            console.error('innerError', innerError);
            throw new Error('fieldName 与 innerError必须同时存在，此处'+(fieldName?'fieldName':'innerError')+'为空');
        }
    }

    static readonly success = new ValidateResult(ValidateErrorCode.Succ);

    /**
     * 最里面的错误，如对上面 {a:{b:{c:"Wrong"}}} 的例子
     * 返回为
     * { errcode:BasicTypeNotMatch, fieldName:'a.b.c' }
     * 返回中一定没有innerError
     * @returns {ValidateResult}
     */
    get originalError():ValidateResult{
        let fieldNames:string[] = [];
        let result:ValidateResult = this;
        while(true){
            if(result.innerError){
                fieldNames.push(result.fieldName as string);
                result = result.innerError;
            }
            else{
                let output = new ValidateResult(result.errcode);
                output.fieldName = fieldNames.join('.');
                return output;
            }
        }
    }

    get isSuccess():boolean{
        return this.errcode==0;
    }

    get isError():boolean{
        return this.errcode!=0;
    }

    get message():string{
        return ValidateResult.ErrorMessages[this.errcode] || '未知错误';
    }
}

