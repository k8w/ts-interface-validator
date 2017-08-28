import IValidator from './IValidator';
import ValidatorManager from "../ValidatorManager";
import ValidateError from "../models/ValidateResult";
import { ValidateErrorCode } from "../models/ValidateResult";
import ValidatorUtil from "./ValidatorUtil";
import ValidateResult from "../models/ValidateResult";

export default class InterfaceValidator implements IValidator {
    readonly filename: string;
    readonly name: string;
    readonly fieldValidators: FieldValidator[];
    fieldNames: {
        [key: string]: null;
    };
    readonly importDef: string;
    readonly strictNullChecks: boolean;
    readonly extendsInterfaceValidator?: InterfaceValidator;
    indexValidator?: IValidator;

    constructor(typedef: string, options?: {
        name?: string,
        filename?: string,
        importDef?: string,
        strictNullChecks?: boolean,
        extendsTypeName?: string
    }) {
        this.filename = options && options.filename || '';
        this.name = options && options.name || '';
        this.fieldValidators = [];
        this.importDef = options && options.importDef || '';
        this.strictNullChecks = options && options.strictNullChecks || false;

        //继承的基类
        if (options && options.extendsTypeName) {
            this.extendsInterfaceValidator = ValidatorManager.instance.getInterfaceValidator(
                ValidatorManager.instance.getReferencedTypePath(options.extendsTypeName, this),
                options.extendsTypeName,
                this.strictNullChecks
            );
        }

        //去除无用信息和头尾括号
        typedef = ValidatorUtil.removeComment(typedef).replace(/^\{/, '').replace(/\}$/, '').trim();

        //解析typedef 生成fieldValidators
        let bracketsLevel = 0, braceLevel = 0;
        let startPos = 0, lineStart = 0;
        for (let curPos = 0; curPos < typedef.length; ++curPos) {
            switch (typedef[curPos]) {
                case '{':
                    ++braceLevel;
                    break;
                case '}':
                    --braceLevel;
                    break;
                case '(':
                    ++bracketsLevel;
                    break;
                case ')':
                    --bracketsLevel;
                    break;
                case ';':
                case ',':
                    if (bracketsLevel == 0 && braceLevel == 0) {
                        let fieldDef = typedef.substr(startPos, curPos - startPos);
                        this.fieldValidators.push(new FieldValidator(this, fieldDef, this.strictNullChecks));
                        startPos = curPos + 1;
                    }
                    break;
                case '\n':
                    //在顶层，一段文字后换行，其实是省略了行尾分号的情况
                    if (bracketsLevel == 0 && braceLevel == 0
                        && typedef.substr(lineStart, curPos - lineStart + 1).trim().length   //这一行不全是空白
                    ) {
                        let fieldDef = typedef.substr(startPos, curPos - startPos).trim();
                        fieldDef && this.fieldValidators.push(new FieldValidator(this, fieldDef, this.strictNullChecks));
                        startPos = curPos + 1;
                    }

                    lineStart = curPos + 1;
                    break;
            }
        }
        if (startPos < typedef.length) {
            this.fieldValidators.push(new FieldValidator(this, typedef.substr(startPos), this.strictNullChecks));
        }

        //去除空的validator（比如index）
        this.fieldValidators = this.fieldValidators.filter((v: FieldValidator)=>v.validator != undefined)

        //生成fieldNames Map
        this.fieldNames = this.fieldValidators.reduce((prev: any, next: any) => {
            prev[next.fieldName] = null;
            return prev;
        }, {})

        //有继承 则扩展allowedFields
        if (this.extendsInterfaceValidator) {
            Object.assign(this.fieldNames, this.extendsInterfaceValidator.fieldNames);
            Object.assign(this.extendsInterfaceValidator.fieldNames, this.fieldNames);
        }
    }

    validate(value: any): ValidateError {
        //不是Object
        if (typeof value !== 'object' || Array.isArray(value)) {
            return new ValidateResult(ValidateErrorCode.NotObject);
        }

        //若有继承 检查继承正确
        if (this.extendsInterfaceValidator) {
            let extendsResult = this.extendsInterfaceValidator.validate(value);
            if (extendsResult.errcode) {
                return extendsResult;
            }
        }

        //检查每个字段类型正确
        for (let i = 0; i < this.fieldValidators.length; ++i) {
            let validator: FieldValidator = this.fieldValidators[i];

            //required test
            if (validator.isRequired && !value.hasOwnProperty(validator.fieldName)) {
                return new ValidateResult(ValidateErrorCode.InterfaceNotMatch, validator.fieldName, new ValidateError(ValidateErrorCode.NullOnRequired));
            }

            let result = validator.validate(value[validator.fieldName]);
            if (result.errcode) {
                return new ValidateResult(ValidateErrorCode.InterfaceNotMatch, validator.fieldName, result);
            }
        }

        //有多余的字段
        for (let key in value) {
            if (value.hasOwnProperty(key) && !this.fieldNames.hasOwnProperty(key)) {                
                if (this.indexValidator) {
                    //有index signature，使用indexValidator
                    let result = this.indexValidator.validate(value[key]);
                    if (result.errcode) {
                        return new ValidateResult(ValidateErrorCode.InterfaceNotMatch, key, result);
                    }
                }
                else {
                    //无index signature，则说明这是多余字段，报错
                    return new ValidateResult(ValidateErrorCode.InterfaceNotMatch, key, new ValidateError(ValidateErrorCode.FieldNotAllowed));
                }
            }
        }

        return ValidateResult.success;
    }
}

export class FieldValidator implements IValidator {
    parent: InterfaceValidator;
    fieldName: string;
    isRequired: boolean;
    validator: IValidator;
    strictNullChecks: boolean;

    /**
     * @param typedef 形如 fieldName? : SomeTypeDef;
     */
    constructor(parent: InterfaceValidator, alldef: string, strictNullChecks: boolean) {
        this.parent = parent;
        this.strictNullChecks = strictNullChecks;

        alldef = alldef.trim();

        //index signature
        if (alldef.startsWith('[')) {
            let matches = alldef.match(/^\[.*\]\s*:([\s\S]+)/);
            if (matches == null) {
                throw new Error('不可识别的类型定义: ' + alldef + ' At ' + parent.filename);
            }
            let typedef = matches[1]
            parent.indexValidator = ValidatorManager.instance.getTypeValidator(typedef, this.parent);
            return;
        }

        let matches = alldef.match(/^([a-zA-Z_\$]\w*)\s*(\??)\s*:\s*([\s\S]+)/);
        if (matches == null) {
            throw new Error('不可识别的类型定义: ' + alldef + ' At ' + parent.filename);
        }
        this.fieldName = matches[1];
        this.isRequired = matches[2] == '';
        let typedef = matches[3];

        this.validator = ValidatorManager.instance.getTypeValidator(typedef, this.parent);
    }

    validate(value: any): ValidateError {
        if (!this.isRequired && (value === undefined || (value === null && !this.strictNullChecks))) {
            return ValidateError.success;
        }

        return this.validator.validate(value);
    }

}