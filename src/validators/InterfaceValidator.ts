import IValidator from './IValidator';
import ValidatorManager from '../ValidatorManager';
import ValidateError from "../models/ValidateResult";
import { ValidateErrorCode } from "../models/ValidateResult";
import ValidatorUtil from "./ValidatorUtil";
import ValidateResult from "../models/ValidateResult";
import LogicValidator from './LogicValidator';
import BasicValidator from './BasicValidator';

export default class InterfaceValidator implements IValidator {
    readonly fieldValidators: FieldValidator[];
    readonly fieldNames: {
        [key: string]: null;
    };

    private readonly name?: string;
    readonly fileName?: string;
    readonly manager: ValidatorManager;
    private readonly extendsName?: string;
    private readonly extendsInterfaceValidator?: InterfaceValidator;
    indexValidator?: IValidator;

    constructor(interfaceDef: string, manager: ValidatorManager, fileName?: string) {
        //Remove comments
        interfaceDef = ValidatorUtil.removeComment(interfaceDef);

        //解析Name和extends
        let headerReg = /^interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/;
        let headerMatch = interfaceDef.match(headerReg);
        if (headerMatch) {
            this.name = headerMatch[1];
            this.extendsName = headerMatch[2];
        }

        this.manager = manager;
        this.fileName = fileName;
        this.fieldValidators = [];

        //继承的基类
        if (this.extendsName) {
            let extendsInterfaceValidator = this.manager.getValidator(this.extendsName, fileName);
            if (!(extendsInterfaceValidator instanceof InterfaceValidator)) {
                throw new Error('Interface can only extends interface')
            }
            this.extendsInterfaceValidator = extendsInterfaceValidator;
        }

        //去除header和头尾括号
        if (headerMatch) {
            interfaceDef = interfaceDef.substr(headerMatch.index! + headerMatch[0].length)
        }
        interfaceDef = interfaceDef.replace(/^\{/, '').replace(/\}$/, '').trim();

        //解析typeDef 生成fieldValidators
        let bracketsLevel = 0, braceLevel = 0;
        let startPos = 0, lineStart = 0;
        for (let curPos = 0; curPos < interfaceDef.length; ++curPos) {
            switch (interfaceDef[curPos]) {
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
                        let fieldDef = interfaceDef.substr(startPos, curPos - startPos);
                        this.addFieldValidator(fieldDef);
                        startPos = curPos + 1;
                    }
                    break;
                case '\n':
                    //在顶层，一段文字后换行，其实是省略了行尾分号的情况
                    if (bracketsLevel == 0 && braceLevel == 0
                        && interfaceDef.substr(lineStart, curPos - lineStart + 1).trim().length   //这一行不全是空白
                    ) {
                        let fieldDef = interfaceDef.substr(startPos, curPos - startPos).trim();
                        fieldDef && this.addFieldValidator(fieldDef);
                        startPos = curPos + 1;
                    }

                    lineStart = curPos + 1;
                    break;
            }
        }
        if (startPos < interfaceDef.length) {
            this.addFieldValidator(interfaceDef.substr(startPos));
        }

        //去除空的validator（比如index）
        this.fieldValidators = this.fieldValidators.filter((v: FieldValidator) => v.validator != undefined)

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

    private addFieldValidator(allDef: string) {
        allDef = allDef.trim();

        //index signature
        if (allDef.startsWith('[')) {
            let matches = allDef.match(/^\[.*\]\s*:([\s\S]+)/);
            if (matches == null) {
                throw new Error('不可识别的类型定义: ' + allDef + ' At ' + this.fileName);
            }
            let typeDef = matches[1]
            this.indexValidator = this.manager.getValidator(typeDef, this.fileName);
        }
        //normal field
        else {
            let matches = allDef.match(/^([a-zA-Z_\$]\w*)\s*(\??)\s*:\s*([\s\S]+)/);
            if (matches == null) {
                throw new Error('不可识别的类型定义: ' + allDef + ' At ' + this.fileName);
            }
            let fieldName = matches[1];
            let isRequired = matches[2] == '';
            let typeDef = matches[3];

            this.fieldValidators.push(new FieldValidator(this, fieldName, typeDef, isRequired));
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

    /**
     * @param typeDef 形如 fieldName? : SometypeDef;
     */
    constructor(parent: InterfaceValidator, fieldName: string, typeDef: string, isRequired: boolean) {
        this.parent = parent;
        this.fieldName = fieldName;
        this.validator = parent.manager.getValidator(typeDef, parent.fileName);
        if (typeDef == 'undefined') {
            this.isRequired = false;
        }
        // XXX | XXX | undefined
        else if (
            this.validator instanceof LogicValidator && this.validator.condition == 'OR'
            && this.validator.childValidators.some(v => v instanceof BasicValidator && v.typeDef == 'undefined')
        ) {
            this.isRequired = false;
            //移除LOGIC里的undefined（有isRequired就够了）
            for (let i = this.validator.childValidators.length - 1; i > -1; --i){
                let v = this.validator.childValidators[i];
                if (v instanceof BasicValidator && v.typeDef == 'undefined') {
                    this.validator.childValidators.splice(i, 1);
                }
            }
            if (this.validator.childValidators.length == 1) {
                this.validator = this.validator.childValidators[0];
            }
        }
        else {
            this.isRequired = isRequired;
        }
    }

    validate(value: any): ValidateError {
        if (!this.isRequired && (value === undefined || (value === null && !this.parent.manager.strictNullChecks))) {
            return ValidateError.success;
        }

        return this.validator.validate(value);
    }

}