/*
    Copyright (c) 2014 bravf(bravfing@126.com)
*/

Stars = function (){
    var css = {
        inputError : 'stars-input-error'
    }

    function myclass(){
        return function (){
            this.init.apply(this, arguments)
        }
    }

    function concatArr(arr1, arr2){
        Array.prototype.push.apply(arr1, arr2)
    }

    function eventCreater(name){
        return function (func){
            var me = this
            me.$event.on(name, function (){
                func(me)
            })
            return me
        }
    }

    var RegRule = myclass()
    RegRule.prototype = {
        type : 'RegRule',
        init : function (reg, msg){
            this.reg = reg
            this.msg = msg
        },
        check : function (control){
            return this.reg.test(control.val())
        }
    }

    var FuncRule = myclass()
    FuncRule.prototype = {
        type : 'FuncRule',
        init : function (func, msg){
            this.func = func
            this.msg = msg
        },
        check : function (control){
            return this.func(control)
        }
    }

    var IORule = myclass()
    IORule.prototype = {
        type : 'IORule',
        init : function (url, callback, msg){
            this.url = url
            this.callback = callback
            this.msg = msg
            this.status = true
        },
        check : function (control){
            var me = this

            if (me.reflow){
                me.reflow = false
                return me.status
            }

            var url = me.url + encodeURIComponent(control.val()) + '&t=' + (new Date).getTime()

            $.getJSON(url, function (data){
                me.status = me.callback(control, data)
                me.reflow = true
                control.check()
            })

            return me.status
        }
    }

    var NotRule = myclass()
    NotRule.prototype = {
        type : 'NotRule',
        init : function (rule, msg){
            this.rule = rule
            this.msg = msg
        },
        check : function (control){
            return !this.rule.check(control)
        }
    }

    var AndRule = myclass()
    AndRule.prototype = {
        type : 'AndRule',
        init : function (){
            this.msg = ''
            this.rules = []
            concatArr(this.rules, arguments)
        },
        add : function (){
            concatArr(this.rules, arguments)
            return this
        },
        check : function (control){
            for (var i= 0, rule; i<this.rules.length; i++){
                rule = this.rules[i]
                if (!rule.check(control)){
                    this.msg = rule.msg
                    return false
                }
            }
            return true
        }
    }

    var OrRule = myclass()
    OrRule.prototype = $.extend({}, AndRule.prototype)
    OrRule.prototype.type = 'OrRule'
    OrRule.prototype.check = function (control){
        for (var i= 0, rule; i<this.rules.length; i++){
            rule = this.rules[i]
            if (rule.check(control)){
                return true
            }
            if (rule.msg){
                this.msg = rule.msg
            }
        }
        return false
    }

    var TextControl = myclass()
    TextControl.prototype = {
        type : 'TextControl',
        triggerType : 'blur',
        init : function ($ele){
            this.$ele = $($ele)
            this.$tipEle = $('<div/>')
            this.$event = $('<div/>')
            this.rules = []
            this.msg = ''
            this.parent = null

            this.initStarsEvent()
            this.bindEvents()
        },
        setTipEle : function ($tipEle){
            this.$tipEle = $($tipEle)
            return this
        },
        add : function (){
            concatArr(this.rules, arguments)
            return this
        },
        val : function (){
            return this.$ele.val() || this.$ele.attr('data-stars-value') || ''
        },
        destory : function (){
            this.hasDestory = true
        },
        isDestoried : function (){
            return !!this.hasDestory
        },
        initStarsEvent : function (){
            var $ele = this.$ele
            var flag = 'data-stars-event'

            if ($ele.attr(flag) == 'yes') {
                return false
            }

            $ele.attr(flag, 'yes')
            var events = ['blur', 'change']

            for (var i=0; i<events.length; i++){
                void function (evt){
                    $ele.on(evt, function (){
                        $ele.trigger('stars-'+evt)
                    })
                }(events[i])
            }
        },
        showTip : function (msg){
            this.msg = msg
            this.$tipEle.html(msg)[msg?'show':'hide']()
            return this
        },
        clearStatus : function (){
            this.showTip('')

            if (this.type == 'TextControl') {
                this.$ele.removeClass(css.inputError)
            }

            if (this.controls){
                $(this.controls).each(function (){
                    this.clearStatus()
                })
            }
        },
        check : function (isSelf){
            if (this.isDestoried()){
                return true
            }
            if (!this.parent){
                this.clearStatus()
                return this.checkSelf()
            }
            else {
                if (isSelf){
                    return this.checkSelf()
                }
                else {
                    return this.parent.check()
                }
            }
        },
        checkSelf : function (){
            var andRule = new AndRule()
            andRule.add.apply(andRule, this.rules)

            var ret = andRule.check(this)
            this.execCallback(ret)
            this.showTip(andRule.msg)

            return ret
        },
        execCallback : function (ret){
            this.$event.trigger('always').trigger(ret?'success':'error')
        },
        bindEvents : function (){
            var me = this
            var eventType = 'stars-' + me.triggerType
            me.$ele.off(eventType).on(eventType, function (){
                me.check()
            })

            if (me.type == 'TextControl'){
                me.onError(function (){
                    me.$ele.addClass(css.inputError)
                })
            }

            return me
        }
    }
    $.extend(TextControl.prototype, {
        onSuccess : eventCreater('success'),
        onError : eventCreater('error'),
        onAlways : eventCreater('always')
    })

    var SelectControl = myclass()
    SelectControl.prototype = $.extend({}, TextControl.prototype)
    SelectControl.prototype.type = 'SelectControl'
    SelectControl.prototype.triggerType = 'change'

    var RadioControl = myclass()
    RadioControl.prototype = $.extend({}, SelectControl.prototype)
    RadioControl.prototype.type = 'RadioControl'

    var CheckboxControl = myclass()
    CheckboxControl.prototype = $.extend({}, SelectControl.prototype)
    CheckboxControl.prototype.type = 'CheckboxControl'

    var AndControl = myclass()
    AndControl.prototype = $.extend({}, TextControl.prototype)
    AndControl.prototype.type = 'AndControl'
    AndControl.prototype.init = function (){
        this.$event = $('<div/>')
        this.$tipEle = $('<div/>')
        this.controls = []
        this.parent = null
        this.msg = ''

        this.add.apply(this, arguments)
        this.bindEvents()
    }
    AndControl.prototype.add = function (){
        var me = this
        concatArr(me.controls, arguments)
        $(me.controls).each(function (){
            this.parent = me
        })
        return this
    }
    AndControl.prototype.checkSelf = function (){
        var ret = true
        var msg = ''

        for (var i=0, control; i<this.controls.length; i++){
            control = this.controls[i]
            if (!control.check(true)){
                msg = control.msg
                ret = false
                break
            }
        }

        this.showTip(msg)
        this.execCallback(ret)
        return ret
    }
    AndControl.prototype.bindEvents = function (){
        var me = this
        me.onSuccess(function (){
            me.clearStatus()
        })
    }

    var OrControl = myclass()
    OrControl.prototype = $.extend({}, AndControl.prototype)
    OrControl.prototype.type = 'OrControl'
    OrControl.prototype.checkSelf = function(){
        var ret = false
        var msg = ''

        for (var i=0, control; i<this.controls.length; i++){
            control = this.controls[i]
            if (!control.check(true)){
                if (control.msg && !msg) {
                    msg = control.msg
                }
            }
            else {
                msg = ''
                ret = true
                break
            }
        }

        this.showTip(msg)
        this.execCallback(ret)
        return ret
    }

    var FormControl = myclass()
    FormControl.prototype = $.extend({}, AndControl.prototype)
    FormControl.prototype.type = 'FormControl'
    FormControl.prototype.add = function (){
        concatArr(this.controls, arguments)
        return this
    }
    FormControl.prototype.check = function (){
        var me = this
        var ret = true
        $(me.controls).each(function (){
            if (!this.check()){
                ret = false
            }
        })
        me.execCallback(ret)
        return ret
    }

    function rule(a, b, c){
        var t = $.type(a)
        if (t == 'regexp'){
            return new RegRule(a, b)
        }
        else if (t == 'function'){
            return new FuncRule(a, b)
        }
        else if (t == 'string'){
            return new IORule(a, b, c)
        }
        throw 'Rule error:' + a + ',' + b
    }

    function not(rule, msg){
        return new NotRule(rule, msg)
    }

    function control($ele){
        $ele = $($ele)

        var eleType = $ele.prop("type")
        var obj

        switch (eleType){
            case "text":
            case "hidden":
            case "textarea":
            case "password":
                obj = new TextControl($ele)
                break

            case "radio":
                obj = new RadioControl($ele)
                break

            case "select-one":
            case "select-multiple":
            case "file":
                obj = new SelectControl($ele)
                break

            case "checkbox":
                obj = new CheckboxControl($ele)
                break
        }

        return obj
    }

    var andOr = function (t){
        t = (t == "and") ? "and" : "or"

        var ruleMap = {'and' : AndRule, 'or' : OrRule}
        var controlMap = {'and' : AndControl, 'or' : OrControl}

        var fn = function (){
            var args = arguments
            var obj

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

    function required(msg){
        function func(control){
            var $ele = control.$ele
            var eleType = $ele.prop("type")

            if (eleType == 'checkbox' || eleType == 'radio'){
                return $ele.prop('checked')
            }
            else if (eleType == 'select-one'){
                var value = control.val()
                return (value != '-1') && (value != '')
            }
            else if (eleType == 'file'){
                return $ele[0].files.length != 0
            }
            else {
                return $.trim(control.val()) != ''
            }
        }
        return new FuncRule(func, msg)
    }

    function length(range, msg){
        var min = parseInt(range[0])
        var max = parseInt(range[1])

        if (isNaN(min) && isNaN(max)){
            throw 'length error'
        }

        function func(control){
            var $ele = control.$ele
            var len = $.trim($ele.val()).length

            if (!isNaN(min) && !isNaN(max)){
                return (len >= min) && (len < max)
            }
            if (isNaN(min)){
                return len < max
            }
            return len >= min
        }

        return new FuncRule(func, msg)
    }

    function any($eles, msg){
        $eles =  $($eles)
        var orControlObj = new OrControl

        $eles.each(function (){
            var me = $(this)
            orControlObj.add(control(me).add(required(msg)))
        })

        return orControlObj
    }

    return {
        css : css,

        RegRule : RegRule,
        FuncRule : FuncRule,
        IORule : IORule,
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