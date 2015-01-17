/**
 * @file 跨页面跨域广播通信代理
 * @author yanping(yanping@baidu.com)
 */

;(function (global, factory) {
    if (typeof define === 'function' && define.amd) { // AMD
        define(factory);
    }
    else {
        global.Proxy = factory.call(global);
    }
}(typeof window !== 'undefined' ? window : this, function () {

        var localStorage = window.localStorage;

        var toString = Object.prototype.toString;

        /**
         * 用于记录页面时间戳的key值
         *
         * @inner
         * @const
         * @type {string}
         */
        var PAGE_KEY = 'MESSAGE_TIMESTAMP';

        /**
         * 获取页面的时间戳
         *
         * @inner
         * @type {Number}
         */
        var timeStamp = 0;

        /**
         * 默认配置
         *
         * @type {Object}
         */
        var default_config = {
            /**
             * 分割符，发送的数据里面不允许包含该符号
             *
             * @type {string}
             */
            splitMark: '/',
            /**
             * 默认所有域
             * 数据发送到指定的域名
             * 
             * @type {string}
             */
            origin: '*'
        };

        /**
         * 判断object
         *
         * @inner
         * @param  {*}  obj 待判断对象
         * @return {Boolean}     是则返回true，否则false
         */
        function isObject(obj) {
            return toString.call(obj) === '[object Object]';
        }

        /**
         * 判断function
         *
         * @inner
         * @param  {*}  obj 待判断对象
         * @return {Boolean}     是则返回true，否则返回false
         */
        function isFuc(obj) {
            return toString.call(obj) === '[object Function]';
        }

        /**
         * 对象属性拷贝
         *
         * @inner
         * @param {Object} target 目标对象
         * @param {Object} source 源对象
         * @return {Object} 返回目标对象
         */
        function extend(target, source) {
            if (!source) {
                return target;
            }
            Object.keys(source).forEach(
                function (key) {
                    target[key] = source[key];
                }
            );
            return target;
        }

        /**
         * 构造函数
         *
         * @constructor
         * @param {Object=} options 参数
         * @param {string} options.splitMark 分隔符，使用特殊符号，
         *                 传递的消息里面不能包含该符号
         * @param {string} options.origin 消息发送到的域
         */
        function Proxy(options) {
            var properties = extend(default_config, options);
            this.setProperties(properties);

            this.listeners = [];
            this.initListen();
        }

        Proxy.prototype = {

            // 修正constructor
            constructor: Proxy,

            /**
             * 初始化，监听
             */
            initListen: function () {
                var self = this;
                /**
                 * 执行事件队列
                 *
                 * @inner
                 * @param  {Object}   msg 消息对象
                 * @param  {string}   msg.key 消息key
                 * @param  {string}   msg.value 消息value
                 */
                function callback(msg) {
                    if (!self.listeners) {
                        return;
                    }
                    self.listeners.forEach(
                        function (fuc) {
                            if (isFuc(fuc)) {
                                fuc(msg);
                            }
                        }
                    );
                }
                /**
                 * message事件监听
                 *
                 * @inner
                 * @param  {Object} msg 消息事件对象
                 */
                function messListen(msg) {
                    if (!msg) {
                        return;
                    }
                    msg = JSON.parse(msg.data);
                    callback(msg);
                }
                /**
                 * storage事件监听
                 *
                 * @inner
                 * @param  {Object} msg 存储事件对象
                 */
                function storageListen(msg) {
                    if (!msg) {
                        return;
                    }
                    // 判断是否页面定时器事件
                    // 获取时间戳
                    if (msg.key == PAGE_KEY) {

                        timeStamp = msg.newValue;
                        console.log(timeStamp);
                        return;
                    }
                    // 包装消息对象
                    msg = {
                        key: msg.key,
                        value: msg.newValue.split(self.splitMark)[0]
                    }
                    callback(msg);
                }
                window.addEventListener('message', messListen, false);
                window.addEventListener('storage', storageListen, false);
            },
            /**
             * 批量设置属性值
             *
             * @param {Object} properties 属性值集合
             */
            setProperties: function (properties) {
                var self = this;
                Object.keys(properties).forEach(
                    function (key) {
                        self[key] = properties[key];
                    }
                );
            },
            /**
             * 发送消息
             *
             * @param  {Object} message 消息
             * @param  {string} message.key 消息key
             * @param  {string} message.value 消息value
             * @param  {Object=} target  窗口句柄 没有句柄则尝试实现对同域发送数据
             */
            send: function (message, target) {
                // 传了target，则使用postMessage
                if (target) {
                    if (isObject(message)) {
                        message = JSON.stringify(message);
                    }
                    else {
                        message = message.toString();
                        message = {
                            key: message,
                            value: message
                        }
                        message = JSON.stringify(message);
                    }
                    target.postMessage(message, this.origin);
                }
                // 获取不到窗口句柄
                // 同域，使用localStorage
                // localStorage如果两次数据一样，不会触发storage事件
                // 使用分隔符做分割 添加上时间戳
                else {
                    var end = this.splitMark + Date.now();
                    if (isObject(message)) {
                        localStorage.setItem(message.key, message.value + end);
                    }
                    else {
                        message = message.toString();
                        localStorage.setItem(message, message + end);
                    }
                }
            },
            /**
             * 增加事件监听
             * 
             * @param  {Function(Object)} callback 回调
             */
            listen: function (callback) {
                this.listeners.push(callback);
            },

            /**
             * 判断是否有同域页面已经打开
             * 需要实时检测，也就是需要结果的时候调用该方法
             * 
             * @param  {Function(booblean)} callback 回调
             *     参数为true，表示已经有打开的页面
             *     参数为false，表示没有打开的页面
             */
            isOpend: function (callback) {
                // TODO:调研多浏览器发现跨页面写数据，接收到的时间间隔约为1s左右
                // 需要进一步考察得出准确的时间值
                // 此方法存在误差,页面关闭之后的1200ms内再次判断有被误认为已经打开的可能性。
                if (Date.now() - timeStamp > 1200) {
                    callback && callback(false);
                }
                else {
                    callback && callback(true);
                }
            },
            /**
             * 清除事件监听
             */
            clearListen: function () {
                this.listeners = [];
            },
            /**
             * 证明自己页面存活
             */
            proveAlive: function () {
                // 起定时器写存储
                setInterval(
                    function () {
                        localStorage.setItem(PAGE_KEY, Date.now());
                    },
                    500
                );
            }
        };

        return Proxy;
    })
);