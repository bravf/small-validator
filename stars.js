/*
 * bravfing@126.com
 * 2014.3.1
 */

stars = function (){
    var objCache = {
        id : 0,
        table : [],
        pushObj : function (obj){
            obj.id = this.id++
            this.table[this.id] = obj
        },
        getObj : function (id){
            return this.table[id]
        }
    }

    //辅助方法
    function myclass(){
        return function (){
            objCache.pushObj(this)
            this.init.apply(this, arguments)
        }
    }
    function toArray(arrLike){
        return [].slice.call(arrLike)
    }
    function getElement(ele){
        return $(ele)
    }
    
    var okMsg = ''

    //rules声明
    var RegRule = myclass()
    var FuncRule = myclass()
    var AndRule = myclass()
    var OrRule = myclass()
    var NotRule = myclass()

    //rules实现
    RegRule.prototype = {
        type : 'RegRule',
        init : function (regexp, msg){
            this.regexp = regexp
            this.msg    = msg || ''
        },
        check : function (control){
            return this.regexp.test(control.val())
        }
    }
    FuncRule.prototype = {
        type : 'FuncRule',
        init : function (func, msg){
            this.func = func
            this.msg    = msg || ''
        },
        check : function (control){
            return this.func(control)
        }
    }
    NotRule.prototype = {
        type : 'NotRule',
        init : function (rule, msg){
            this.rule = rule
            this.msg    = msg || ''
        },
        check : function (control){
            return !this.rule.check(control)
        }
    }
    AndRule.prototype = {
        type : 'AndRule',
        init : function (){
            var args = toArray(arguments)
            this.msg = ''
            this.rules = []
            this.rules = this.rules.concat(args)
        },
        add : function (){
            this.rules = this.rules.concat(toArray(arguments))
            return this
        },
        check : function (control){
            if (!this.rules.length) {
                return true
            }

            for (var i=0; i<this.rules.length; i++){
                var rule = this.rules[i]
                var ret = rule.check(control)
                if (!ret){
                    this.msg = rule.msg
                    return false
                }
            }

            return true
        }
    }
    OrRule.prototype = $.extend({}, AndRule.prototype)
    OrRule.prototype.type ='OrRule'
    OrRule.prototype.check = function (control){
        if (!this.rules.length) {
            return true
        }

        for (var i=0; i<this.rules.length; i++){
            var rule = this.rules[i]
            var ret = rule.check(control)
            if (ret){
                return true
            }
        }

        this.msg = this.rules[this.rules.length-1].msg
        return false
    }

    //controls声明
    var FormControl = myclass()
    var TextControl = myclass()
    var RadioControl = myclass()
    var SelectControl = myclass()
    var CheckboxControl = myclass()
    var AndControl = myclass()
    var OrControl = myclass()

    //controls实现
    //input[text],textarea control实现
    TextControl.prototype = {
        type : 'TextControl',
        init : function (ele, tipMsg, tipEle){
            this.element = getElement(ele)
            this.rules = []
            this.tipMsg = tipMsg || ''
            this.msg = ''
            this.parent = null
            this.bindEvents()

            if (tipEle){
                this.setTipEle(tipEle)
            }

            this.initNxEvent()
        },
        //注销掉
        destory : function (){
            this.hasDestory = true
        },
        isDestoried : function (){
            return this.hasDestory ? true : false
        },
        //设置回调
        onError : function (func){
            var me = this
            this.element.on('error', function (){
                func(me)
            })
        },
        onSuccess : function (func){
            var me = this
            this.element.on('success', function (){
                func(me)
            })
        },
        doCallback : function (ret){
            this.element.trigger(ret ? 'success' : 'error')
            return this
        },
        initNxEvent : function (){
            var element = this.element
            if (element.attr('data-nxevent') == 'yes') {
                return
            }

            element.attr('data-nxevent', 'yes')
            var events = ['click', 'blur', 'change']

            for (var i=0; i<events.length; i++){
                void function (evt){
                    element.on(evt, function (){
                        element.trigger('nx'+evt)
                    })
                }(events[i])
            }
        },
        setTipEle : function (tipEle){
            this.tipElement = getElement(tipEle)
            return this
        },
        addRule : function (){
            this.rules = this.rules.concat(toArray(arguments))
            return this
        },
        showTip : function (msg){
            this.msg = msg
            if (this.parent) return

            if (!this.tipElement){
                this.tipElement = $('<span/>').appendTo(this.element.parent())
            }
            this.tipElement.html(msg)
            this.tipElement[msg.length ? 'show' : 'hide']()
            
            return this
        },
        val : function (){
            return this.element.val()
        },
        check : function (checkSelf){
            if (this.isDestoried()){
                return true
            }
            //如果没有parent，则验证本身
            if (!this.parent){
                return this.checkIt()
            }
            else {
                //如果明确说明验证本身
                if (checkSelf){
                    return this.checkIt()
                }
                //否则向上冒泡
                else {
                    return this.parent.check()
                }
            }
        },
        checkIt : function (){
            var andRule = new AndRule()
            andRule.add.apply(andRule, this.rules)

            var ret = andRule.check(this)

            this.showTip(ret ? okMsg : andRule.msg)
            this.doCallback(ret)
            return ret
        },
        bindEvents : function (){
            var me = this
            this.element.on('focus', function (){
                me.showTip(me.tipMsg)
            })
            .off('nxblur').on('nxblur', function (){
                me.check()
            })
            return this
        }
    }

    //select control实现
    SelectControl.prototype = {
        type : 'SelectControl',
        bindEvents : function (){
            var me = this
            this.element.on('focus', function (){
                me.showTip(me.tipMsg)
            })
            .off('nxchange').on('nxchange', function (){
                me.check()
            })
            return this
        }
    }
    SelectControl.prototype = $.extend(SelectControl.prototype, TextControl.prototype)

    //radio control实现
    RadioControl.prototype = {
        type : 'RadioControl',
        bindEvents : function (){
            var me = this
            this.element.off('nxclick').on('nxclick', function (){
                me.check()
            })
            return this
        }
    }
    RadioControl.prototype = $.extend(RadioControl.prototype, TextControl.prototype)

    //checkbox control实现
    CheckboxControl.prototype = {
        type : 'CheckboxControl',
        bindEvents : function (){
            var me = this
            this.element.off('nxclick').on('nxclick', function (){
                me.check()
            })
            return this
        }
    }
    CheckboxControl.prototype = $.extend(CheckboxControl.prototype, TextControl.prototype)

    //control逻辑与实现(这个组表示依赖验证，比如a,b,c一组，那么a.check会触发组内所有人的check)
    AndControl.prototype = {
        type : 'AndControl',
        init : function (){
            this.msg = ''
            this.parent = null

            this.controls = []
            this.add.apply(this, arguments)
        },
        add : function (){
            var args = toArray(arguments)
            for (var i=0; i<args.length; i++){
                var control = args[i]
                control.parent = this
                this.controls.push(control)
            }
            return this
        },
        checkIt : function (){
            if (!this.controls.length) {
                return true
            }
            this.element = this.controls[0].element

            for (var i=0; i<this.controls.length; i++){
                var control = this.controls[i]
                var ret = control.check(true)

                if (!ret){
                    this.showTip(control.msg)
                    this.doCallback(false)
                    return false
                }
            }

            this.showTip(okMsg)
            this.doCallback(true)
            return true
        }
    }
     AndControl.prototype = $.extend(AndControl.prototype, TextControl.prototype)

    //control逻辑或实现
    OrControl.prototype = {
        type : 'OrControl',
        checkIt : function (){
            if (!this.controls.length){
                return true
            }
            this.element = this.controls[0].element

            for (var i=0; i<this.controls.length; i++){
                var control = this.controls[i]
                var ret = control.check(true)

                if (ret){
                    this.showTip(okMsg)
                    this.doCallback(true)
                    return true
                }
            }

            this.showTip(this.controls[this.controls.length-1].msg)
            this.doCallback(false)
            return false
        }
    }
    OrControl.prototype = $.extend(OrControl.prototype, AndControl.prototype)

    //表示一个表单，实际上并非一定要是form，也可以表示一个表单group，它和AndControl的区别在于子control的check不会联动其他control
    FormControl.prototype = {
        type : 'FormControl',
        init : function (ele){
            this.element = getElement(ele)
            this.controls = []
            this.bindEvents()
            //默认选用check1
            this._check = this.check1
        },
        add : function (){
            this.controls = this.controls.concat(toArray(arguments))
            return this
        },
        //设置check模式，默认为none(检测到失败就停止)，可选all(检测全部)
        setCheckType : function (flag){
            this._check = (flag=='all') ? this.check2 : this.check1
            return this
        },
        check : function (){
            if (this.isDestoried()){
                return true
            }
            this._check()
        },
        check1 : function (){
            for (var i=0; i<this.controls.length; i++){
                var control = this.controls[i]
                var ret = control.check()
                if (!ret) {
                    this.doCallback(false)
                    return false
                }
            }
            this.doCallback(true)
            return true
        },
        check2 : function (){
            var ok = true
            for (var i=0; i<this.controls.length; i++){
                var control = this.controls[i]
                var ret = control.check()
                if (!ret) {
                    ok = false
                }
            }
            this.doCallback(ok)
            return ok
        },
        bindEvents : function (){
            var me = this
            this.element.bind('submit', function (){
                return me.check()
            })
        }
    }
    FormControl.prototype = $.extend(FormControl.prototype, TextControl.prototype)

    //快捷方式
    //根据参数类型自动生成一个Rule对象
    function rule(a, b){
        var t = $.type(a)
        if (t == 'regexp'){
            return new RegRule(a, b)
        }
        else if (t == 'function'){
            return new FuncRule(a, b)
        }
        throw 'Rule error:' + a + ',' + b
    }

    //快捷对一个Rule取非，并返回取非得对象
    function not(rule, msg){
        return new NotRule(rule, msg)
    }

    //根据参数类型自动生成一个control
    function control(ele){
        var ele = getElement(ele)

        if (ele.attr('data-stars-type') == 'form'){
            return new FormControl(ele)
        }

        var eleType = ele.prop("type")
        var obj

        switch (eleType){
            case "text":
            case "file":
            case "hidden":
            case "textarea":
            case "password":
                obj = new TextControl(ele)
                break

            case "radio":
                obj = new RadioControl(ele)
                break

            case "select-one":
            case "select-multiple":
                obj = new SelectControl(ele)
                break

            case "checkbox":
                obj = new CheckboxControl(ele)
                break
        }

        return obj
    }

    //根据参数类型自动生成一个逻辑与或者逻辑或的组control
    var andOr = function (t){
        t = (t == "and") ? "and" : "or"

        var ruleMap = {'and' : AndRule, 'or' : OrRule}
        var controlMap = {'and' : AndControl, 'or' : OrControl}

        var fn = function (){
            var args = toArray(arguments)
            var obj

            // 如果没有参数, 默认为control
            if (!args.length) {
                return new controlMap[t]
            }

            if (args[0].type.indexOf('Control') != -1){
                obj = new controlMap[t]
            }
            else {
                obj = new ruleMap[t]
            }

            obj.add.apply(obj, args)
            return obj
        }

        return fn
    }

    //常用规则
    //返回一个表示(必填、必选)的rule对象
    function required(msg){
        function func(control){
            var element = control.element
            var eleType = element.prop("type")

            if (eleType == 'checkbox' || eleType == 'radio'){
                return element.prop('checked')
            }
            else if (eleType == 'select-one'){
                return element.val() != '-1'
            }
            else {
                return $.trim(element.val()) != ''
            }
        }
        return new FuncRule(func, msg)
    }

    //返回一个表示(长度区间)的rule对象
    function length(range, msg){
        var min = parseInt(range[0])
        var max = parseInt(range[1])

        //如果min,max都非法
        if (isNaN(min) && isNaN(max)){
            throw 'length error'
        }

        function func(control){
            var element = control.element
            var len = $.trim(element.val()).length

            //如果min,max都合法
            if (!isNaN(min) && !isNaN(max)){
                return (len >= min) && (len < max)
            }
            //如果min不合法
            if (isNaN(min)){
                return len < max
            }
            //如果max不合法
            return len >= min
        }

        return new FuncRule(func, msg)
    }

    //针对radio、checkbox组，至少选一个，返回一个逻辑或的组control
    function any(eleList, msg){
        var elements = getElement(eleList)
        var orControlObj = new OrControl

        elements.each(function (){
            var me = $(this)
            orControlObj.add(control(me).addRule(required(msg)))
        })

        return orControlObj
    }

    return {
        getObj : objCache.getObj,

        RegRule : RegRule,
        FuncRule : FuncRule,
        NotRule : NotRule,
        AndRule : AndRule,
        OrRule : OrRule,

        FormControl : FormControl,
        TextControl : TextControl,
        RadioControl : RadioControl,
        SelectControl : SelectControl,
        CheckboxControl : CheckboxControl,
        AndControl : AndControl,
        OrControl : OrControl,

        rule : rule,
        not : not,
        control : control,
        and : andOr('and'),
        or : andOr('or'),

        required : required,
        length : length,

        any : any
    }
}()