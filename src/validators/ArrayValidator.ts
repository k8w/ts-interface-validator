import IValidator from "./IValidator";
import InterfaceValidator from "./InterfaceValidator";
import ValidateResult from "../models/ValidateResult";
import {ValidateErrorCode} from "../models/ValidateResult";
import ValidatorManager from "../ValidatorManager";

export default class ArrayValidator implements IValidator{
    parent: InterfaceValidator;

    constructor(typedef:string, parent:InterfaceValidator){
        this.parent = parent;

        //生成子元素Validator
        let matches = typedef.match(/^([\s\S]*)\[\]$/) || typedef.match(/^Array\<([\s\S]*)\>$/);

        if(!matches || matches.length!=2){
            throw new Error('不合法的Array定义：'+typedef);
        }

        let itemDef = matches[1];
        this.itemValidator = ValidatorManager.instance.getTypeValidator(itemDef, this.parent)
    }

    validate(value:any):ValidateResult{
        //先判断是不是数组
        if(!Array.isArray(value)){
            return new ValidateResult(ValidateErrorCode.NotArray);
        }

        //再确认每一项都类型匹配
        for(let i=0;i<value.length;++i){
            let result = this.itemValidator.validate(value[i]);
            if(result.isError){
                return new ValidateResult(ValidateErrorCode.ArrayNotMatch, i.toString(), result);
            }
        }

        //以上都没问题 返回成功
        return ValidateResult.success;
    }

    readonly itemValidator: IValidator;
}