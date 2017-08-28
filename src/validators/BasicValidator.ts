import IValidator from "./IValidator";
import ValidateResult from "../models/ValidateResult";
import {ValidateErrorCode} from "../models/ValidateResult";
export default class BasicValidator implements IValidator {

    constructor(typedef : string) {
        if (/^(number|string|boolean|[Oo]bject|undefined)$/.test(typedef)) {
            this.validate = this
                .validateType
                .bind(this, typedef.toLowerCase());
        } else if (typedef == 'any') {
            this.validate = this.validateAny;
        } else if (typedef == 'null') {
            this.validate = this.validateNull;
        } else if (/^'.*'$/.test(typedef) || /^".*"$/.test(typedef)) {
            this.validate = this
                .validateStrLiteral
                .bind(this, typedef.substr(1, typedef.length - 2))
        } else {
            throw new Error('错误的类型定义：' + typedef);
        }
    }

    validate : (value : any) => ValidateResult;

    private validateType(type : string, value : any) : ValidateResult {
        const errCodeMap: {
            [key : string] : ValidateErrorCode
        } = {
            'number': ValidateErrorCode.NotNumber,
            'string': ValidateErrorCode.NotString,
            'object': ValidateErrorCode.NotObject,
            'boolean': ValidateErrorCode.NotBoolean,
            'undefined': ValidateErrorCode.NotUndefined
        };
        return typeof(value) == type && value !== null //typeof null == 'object' 故此排除null值
            ? ValidateResult.success
            : new ValidateResult(errCodeMap[type]);
    }

    private validateAny(value : any) : ValidateResult {return ValidateResult.success;}

    private validateNull(value : any) : ValidateResult {
        return value === null
            ? ValidateResult.success
            : new ValidateResult(ValidateErrorCode.NotNull);
    }

    private validateStrLiteral(rightAnswer : string, value : any) {
        if (typeof value != 'string') {
            return value === rightAnswer
                ? ValidateResult.success
                : new ValidateResult(ValidateErrorCode.NotString);
        }

        return value == rightAnswer
            ? ValidateResult.success
            : new ValidateResult(ValidateErrorCode.InvalidStrLiteral);
    }
}