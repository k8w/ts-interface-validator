import ValidateResult from "../models/ValidateResult";
interface IValidator {
    validate(value:any):ValidateResult;
}
export default IValidator;