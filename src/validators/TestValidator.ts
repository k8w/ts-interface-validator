import IValidator from "./IValidator";
import ValidateResult from "../models/ValidateResult";
export default class TestValidator implements IValidator{
    validate(value:any):ValidateResult{
        console.log('TestValidator', value);
        return ValidateResult.success;
    }
}