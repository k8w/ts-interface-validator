import ValidatorManager from './src/ValidatorManager';
import IValidator from './src/validators/IValidator';

const TsInterfaceValidator: {
    getInterfaceValidator(filename: string, name: string): IValidator
} = ValidatorManager.instance;
export default TsInterfaceValidator;

export { IValidator };