import InterfaceValidator from "../src/validators/InterfaceValidator";
import {ValidateErrorCode} from "../src/models/ValidateResult";
import ValidatorManager from "../src/ValidatorManager";
const assert = require('assert');
const path = require('path');

describe('InterfaceValidator', function(){    
    it('Required字段检查', function(){
        let validator = new InterfaceValidator(`{
            $a: any;
            b : any;
            c ? : any;
            d? : any;
        }`);

        let result = validator.validate({$a:1,c:3,d:4}).originalError;
        assert.equal(result.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.fieldName, 'b');

        result = validator.validate({}).originalError;
        assert.equal(result.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.fieldName, '$a');

        result = validator.validate({b:1}).originalError;
        assert.equal(result.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.fieldName, '$a');

        result = validator.validate({$a:1,b:1});
        assert.equal(result.errcode, 0);
        assert.equal(result.fieldName, null);
    });

    it('PtlDemo validate', function(){
        let validator = ValidatorManager.instance.getInterfaceValidator(path.resolve(__dirname,'res/protocol/PtlDemo.ts'), 'ReqDemo');
        let result = validator.validate({
            paramA:'TestA',
            paramB:1234,
            paramC:'value1',
            paramD:{a:'abc', b:'bbc'}
        });
        assert.equal(result.errcode, 0, result.fieldName);

        result = validator.validate({
            paramA:'TestA'
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.originalError.fieldName,'paramB');

        result = validator.validate({
            paramA:'TestA',
            paramB: '1234',
            paramC: 'fakeValue'
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NotNumber);
        assert.equal(result.originalError.fieldName,'paramB');

        result = validator.validate({
            paramA:'TestA',
            paramB: 1234,
            paramC: 'fakeValue'
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(result.originalError.fieldName,'paramC');

        result = validator.validate({
            paramA:'TestA',
            paramB: 1234,
            paramC: 'valueB',
            paramD: {a:'test'}
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.originalError.fieldName,'paramD.b');

        result = validator.validate({
            paramA:'TestA',
            paramB: 1234,
            paramC: 'valueB',
            paramD: {a:123,b:'test'}
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NotString);
        assert.equal(result.originalError.fieldName,'paramD.a');

        result = validator.validate({
            paramA:'TestA',
            paramB: 1234,
            paramC: 'valueB',
            paramE: {a:123,b:1234}
        });
        assert(result.isSuccess);
        
        result = validator.validate({
            paramA:'TestA',
            paramB: 1234,
            paramC: 'valueB',
            paramE: {a:123,b:'123'}
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NotNumber);
        assert.equal(result.originalError.fieldName,'paramE.b');

        result = validator.validate({
            paramA:'TestA',
            paramB: 1234,
            paramC: 'valueB',
            paramF: {0:['a','b'], 1:['c','d']}
        });
        assert(result.isSuccess);
        
        result = validator.validate({
            paramA:'TestA',
            paramB: 1234,
            paramC: 'valueB',
            paramF: {0:['a','b'], 1:123}
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NotArray);
        assert.equal(result.originalError.fieldName,'paramF.1');

        result = validator.validate({
            paramA:'TestA',
            paramB: 1234,
            paramC: 'valueB',
            paramF: {0:['a','b'], 1:['c',false]}
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NotString);
        assert.equal(result.originalError.fieldName,'paramF.1.1');
    })

    it('import', function(){
        let validator = ValidatorManager.instance.getInterfaceValidator(path.resolve(__dirname,'res/protocol/PtlImport.ts'), 'ReqImport');
        let result = validator.validate({
            input:{
                a:'test',
                b:123
            }
        });
        assert.equal(result.errcode, 0, result.originalError.fieldName+result.originalError.message);

        result = validator.validate({
            input:{
                a:123,
                b:123
            }
        });
        assert.equal(result.errcode, ValidateErrorCode.InterfaceNotMatch);

        result = validator.validate({
            input:{
                a:'test',
                b:'test'
            }
        });
        assert.equal(result.errcode, ValidateErrorCode.InterfaceNotMatch);
    })

    it('strictNullChecks', function () {
        let validator = new InterfaceValidator(`{
            a: number;
            b: number | null;
            c: number | null | undefined;
            d?: number;
            e?: number | null;
        }`, {
            strictNullChecks: true
        });

        let result = validator.validate({}).originalError;
        assert.equal(result.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.fieldName, 'a');

        result = validator.validate({a:1}).originalError;
        assert.equal(result.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.fieldName, 'b');

        result = validator.validate({a:1, b:null, c:undefined}).originalError;
        assert.equal(result.errcode, 0);

        result = validator.validate({a:1, b:123, c:undefined}).originalError;
        assert.equal(result.errcode, 0);

        result = validator.validate({a:1, b:null, c:null}).originalError;
        assert.equal(result.errcode, 0);

        result = validator.validate({a:1, b:null, c:null, e:null}).originalError;
        assert.equal(result.errcode, 0);

        result = validator.validate({a:1, b:null, c:null, d:null, e:null}).originalError;
        assert.equal(result.errcode, ValidateErrorCode.NotNumber);
        assert.equal(result.fieldName, 'd');
    });

    it('限制多余字段', function(){
        let validator = new InterfaceValidator(`{
            a: number;
        }`, {
            strictNullChecks: true
        });

        let result = validator.validate({a:1,b:2}).originalError;
        assert.equal(result.errcode, ValidateErrorCode.FieldNotAllowed);
        assert.equal(result.fieldName, 'b');

        result = validator.validate({a:1}).originalError;
        assert.equal(result.errcode, 0);

    })

    it('extends', function(){
        let validator = ValidatorManager.instance.getInterfaceValidator(path.resolve(__dirname,'res/protocol/Child.ts'), 'Child');
        let result = validator.validate({
            parentValue: 123,
            childValue: 123
        });
        assert.equal(result.errcode, 0);

        result = validator.validate({
            childValue: 123
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.originalError.fieldName,'parentValue');

        result = validator.validate({
            parentValue: 123
        });
        assert(result.isError);
        assert.equal(result.originalError.errcode, ValidateErrorCode.NullOnRequired);
        assert.equal(result.originalError.fieldName,'childValue');
    })
});