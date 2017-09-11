TypeScript Interface Validator
---------------------------------

## Intro

A library to validate whether a value is matched a typescript interface definition.

This is a lightweight and individual implementaion. So only support limited forms of definition.

For more detail you can see *Supported* and *Not Supported* below.

If you should have any question, please feel free to let me know.

## Usage

```typescript
import ValidatorManager from 'ts-interface-validator';
let manager = new ValidatorManager();

//Validate from type definition
let validator = manager.getValidator('{ a: string; b: number[]; c?: \'C1\' | \'C2\'}');
//Validate from definition in file
let validator2 = manager.getValidator('TypeName', 'xxx.ts');

//Validate
let result = validator.validate({ a: 'a', b: [2, 'b'] });
if (result.isSuccess) {
    //succ
}
else {
    console.log(result.message, result.originalError.message)
}
```



### Supported pattern

1. Basic type as  `string`, `number`, `boolean`, `Object`, `any`
1. Array type as `T[]` or `Array<T>`
1. Type alias as `type Abc = string`
1. Nested referenced interface, as `type Bcd = Abc`
1. Logical expression, such as `string | number`
1. String literal，as `'Value1' | 'Value2'`
1. Relative import
1. Extend, as `interface Def extends Abc { ... }`
1. Index signature, as `{ [key: string]: number }`
1. Partial type, as `Partial<T>`
1. Ignore comments automatically

### Not Supported pattern

1. import must be finished in single line, and must be ended with semicolon
1. Mapped Types
1. Circular reference