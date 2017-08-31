import ValidatorUtil from "../src/validators/ValidatorUtil";
const assert = require('assert');

describe('ValidatorUtil', function(){
    it('removeComment', function(){
        let src = `{
            /**
             * Test 这里是 评论
             */
            test?: string;//asdgasdgsdag
            /*asdgasdg*/
            //asdgasdgasdgasdgasdg
            test2: number;  //Test的2
            //asdgasdg
            /**/
            /* test4:string*/
            /*are you ok*/test3: number | string;
        }`;

        let result = ValidatorUtil.removeComment(src);
        assert.equal(result, '{\ntest?: string;\ntest2: number;\ntest3: number | string;\n}');
    });

    it('trimBrackets', function () {
        assert.equal(ValidatorUtil.trimBrackets("('value1'|'value2')"), "'value1'|'value2'");
        assert.equal(ValidatorUtil.trimBrackets("('value1')|('value2')"), "('value1')|('value2')");
        assert.equal(ValidatorUtil.trimBrackets("('value1')|'(value2)'"), "('value1')|'(value2)'");
        assert.equal(ValidatorUtil.trimBrackets("((('value1'|'value2')))"), "'value1'|'value2'");
        assert.equal(ValidatorUtil.trimBrackets("(((('value1')|('value2'))))"), "('value1')|('value2')")
    })
});