TypeScript Interface Validator
---------------------------------

**如有问题，欢迎联系 twoeo@qq.com**

## 介绍

为解决TypeScript中Interface无法验证类型合法性的问题，开发这个插件。

结合protocol定义，可以实现API接口输入参数的自动合法性验证。

### 支持的类型

1. 支持 string，number，boolean，Object，any 等基本类型的验证。
1. 支持数组的验证。
1. 支持interface嵌套的验证。
1. 支持逻辑条件组合的验证，如 `string | number`。
1. 支持文本的验证，如 `'Value1' | 'Value2'`。
1. 支持从文件解析interface，或传入interface定义字符串的形式。
1. 支持继承
1. 支持index signature

### 不支持的情况

1. import必须在单行内完成，且必须分号结尾。
1. 暂不支持Mapped Types

## 验证过程

1. 通过ValidatorManager->getInterfaceValidator，从文件中提取interface定义。
1. 手工传入定义字符串，可通过new InterfaceValidator创建Validator。
1. InterfaceValidator首先将每个字段及其定义分割开来，生成FieldValidator。
1. InterfaceValidator决定每个字段是否必须字段（Required）。
1. InterfaceValidator通过ValidatorManager.getFieldValidator生成每个字段的Validator。
1. 执行验证操作validate()时，将遍历fieldValidator，自上而下，所有子validator验证通过则认为验证通过。
1. 任一子Validator抛出错误，则验证停止，抛出当前错误。

## 类型鉴定

1. 是否逻辑条件组合？是则使用LogicValidator， 否则继续。
1. 是否数组？是则使用ArrayValidator， 否则继续。
1. 是否基础类型？是则使用BasicValidator，否则继续。
1. 应该是interface，是否interface定义字符串？是则new InterfaceValidator，否则继续。
1. 应该是interface名，从parent的同一文件中加载其定义。

## 调试脚本

应当安装好ts-node，mocha

### DEBUG

1. 在ts源文件中打好断点
1. `npm run buildDev`
1. 用WebStorm DEBUG dist中的js文件
1. 则可以命中ts中的断点

### 单元测试

1. `npm test`