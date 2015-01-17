## 提供代理能力，实现跨文档通信

## 适用场景 ##

- 父窗口与iframe之间通信
- 父窗口与新开窗口通信
- 任一窗口与跨域页面通信
- 适用于IE9及以上

## 使用

1. 在想要支持数据传播的文档中引入 `Proxy` ，支持在 `AMD` 的模块定义环境中使用，也支持直接在页面下通过 `script` 标签引用。

2. 初始化

```javascript
var proxy = new Proxy(options);
```
**options** `{Object=}` 初始化信息
    - **splitMark** `{string}` 分隔符，要传递的消息不允许包含此符号，默认为'/'
    - **origin** `{string}` 允许数据共享到那个域，默认为'*'

3. 添加监听

```javascript
proxy.listen(fuc);
```
* **fuc** `{Function(Object)}` 监听回调函数
参数包含key和value属性
- **key** `{string}` 广播数据的key值
- **value** `{string}` 广播数据的value值

4. 广播数据

```javascript
proxy.send(
    {
        key: '',
        value: ''
    },
    target  // 窗口句柄，例如iframe
);
```
5. 扩展

对于获取不到窗口句柄，又跨域的页面，也可以传播数据。
- 如果想要从a.com/a.html传播数据给独立窗口b.com/b.html
    - 在a.com中创建iframe指向b.com/proxy.html
    - 在三个页面中都引入Proxy，在b.html和proxy.html添加监听
    - 在a.html和proxy.html广播数据

这样就可以完成两个不相干的页面数据传播啦。

