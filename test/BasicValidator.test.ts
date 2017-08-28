import BasicValidator from "../src/validators/BasicValidator";
import {ValidateErrorCode} from "../src/models/ValidateResult";
const assert = require('assert');

describe('BasicValidator', function(){
    it('validate number', function(){
        let validator = new BasicValidator('number');
        assert.equal(validator.validate(123).errcode, 0);
        assert.equal(validator.validate(0).errcode, 0);
        assert.equal(validator.validate(NaN).errcode, 0);
        assert.equal(validator.validate(Infinity).errcode, 0);
        assert.equal(validator.validate('').errcode, ValidateErrorCode.NotNumber);
        assert.equal(validator.validate('123').errcode, ValidateErrorCode.NotNumber);
        assert.equal(validator.validate('test').errcode, ValidateErrorCode.NotNumber);
        assert.equal(validator.validate({a:1,b:2}).errcode, ValidateErrorCode.NotNumber);
        assert.equal(validator.validate([1,1,1,1]).errcode, ValidateErrorCode.NotNumber);
        assert.equal(validator.validate(true).errcode, ValidateErrorCode.NotNumber);
        assert.equal(validator.validate(null).errcode, ValidateErrorCode.NotNumber);
        assert.equal(validator.validate(undefined).errcode, ValidateErrorCode.NotNumber);
    });

    it('validate string', function(){
        let validator = new BasicValidator('string');
        assert.equal(validator.validate(123).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(0).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(NaN).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(Infinity).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate('').errcode, 0);
        assert.equal(validator.validate('123').errcode, 0);
        assert.equal(validator.validate('test').errcode, 0);
        assert.equal(validator.validate({a:1,b:2}).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate([1,1,1,1]).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(true).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(null).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(undefined).errcode, ValidateErrorCode.NotString);
    });

    it('validate boolean', function(){
        let validator = new BasicValidator('boolean');
        assert.equal(validator.validate(123).errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate(0).errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate(NaN).errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate(Infinity).errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate('').errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate('123').errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate('test').errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate({a:1,b:2}).errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate([1,1,1,1]).errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate(true).errcode, 0);
        assert.equal(validator.validate(null).errcode, ValidateErrorCode.NotBoolean);
        assert.equal(validator.validate(undefined).errcode, ValidateErrorCode.NotBoolean);
    });

    it('validate Object', function(){
        let validator = new BasicValidator('Object');
        assert.equal(validator.validate(123).errcode, ValidateErrorCode.NotObject);
        assert.equal(validator.validate(0).errcode, ValidateErrorCode.NotObject);
        assert.equal(validator.validate(NaN).errcode, ValidateErrorCode.NotObject);
        assert.equal(validator.validate(Infinity).errcode, ValidateErrorCode.NotObject);
        assert.equal(validator.validate('').errcode, ValidateErrorCode.NotObject);
        assert.equal(validator.validate('123').errcode, ValidateErrorCode.NotObject);
        assert.equal(validator.validate('test').errcode, ValidateErrorCode.NotObject);
        assert.equal(validator.validate({a:1,b:2}).errcode, 0);
        assert.equal(validator.validate([1,1,1,1]).errcode, 0);
        assert.equal(validator.validate(true).errcode, ValidateErrorCode.NotObject);
        assert.equal(validator.validate(null).errcode, ValidateErrorCode.NotObject);
        assert.equal(validator.validate(undefined).errcode, ValidateErrorCode.NotObject);
    });

    it('validate any', function(){
        let validator = new BasicValidator('any');
        assert.equal(validator.validate(123).errcode, 0);
        assert.equal(validator.validate(0).errcode, 0);
        assert.equal(validator.validate(NaN).errcode, 0);
        assert.equal(validator.validate(Infinity).errcode, 0);
        assert.equal(validator.validate('').errcode, 0);
        assert.equal(validator.validate('123').errcode, 0);
        assert.equal(validator.validate('test').errcode, 0);
        assert.equal(validator.validate({a:1,b:2}).errcode, 0);
        assert.equal(validator.validate([1,1,1,1]).errcode, 0);
        assert.equal(validator.validate(true).errcode, 0);
        assert.equal(validator.validate(null).errcode, 0);
        assert.equal(validator.validate(undefined).errcode, 0);
    });

    it('validate static string', function(){
        let validator = new BasicValidator('"Test"');
        assert.equal(validator.validate(123).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(0).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(NaN).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(Infinity).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate('').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('123').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('test').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('Test').errcode, 0);
        assert.equal(validator.validate(' Test ').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('Test ').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate(' Test').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate({a:1,b:2}).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate([1,1,1,1]).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(true).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(null).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(undefined).errcode, ValidateErrorCode.NotString);

        validator = new BasicValidator("'Test'");
        assert.equal(validator.validate(123).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(0).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(NaN).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(Infinity).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate('').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('123').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('test').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('Test').errcode, 0);
        assert.equal(validator.validate(' Test ').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('Test ').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate(' Test').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate({a:1,b:2}).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate([1,1,1,1]).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(true).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(null).errcode, ValidateErrorCode.NotString);
        assert.equal(validator.validate(undefined).errcode, ValidateErrorCode.NotString);

        validator = new BasicValidator("'\"Test\"'");
        assert.equal(validator.validate('Test').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('"Test"').errcode, 0);

        validator = new BasicValidator('"\'Test\'"');
        assert.equal(validator.validate('Test').errcode, ValidateErrorCode.InvalidStrLiteral);
        assert.equal(validator.validate('\'Test\'').errcode, 0);

    })
});