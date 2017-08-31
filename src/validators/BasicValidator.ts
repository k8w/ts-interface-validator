import IValidator from "./IValidator";
import ValidateResult from "../models/ValidateResult";
import {ValidateErrorCode} from "../models/ValidateResult";
export default class BasicValidator implements IValidator {

    constructor(typeDef : string) {
        if (/^(number|string|boolean|[Oo]bject|undefined)$/.test(typeDef)) {
            this.validate = this
                .validateType
                .bind(this, typeDef.toLowerCase());
        } else if (typeDef == 'any') {
            this.validate = this.validateAny;
        } else if (typeDef == 'null') {
            this.validate = this.validateNull;
        } else if (/^'.*'$/.test(typeDef) || /^".*"$/.test(typeDef)) {
            this.validate = this
                .validateStrLiteral
                .bind(this, typeDef.substr(1, typeDef.length - 2))
        } else {
            throw new Error('错误的类型定义：' + typeDef);
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