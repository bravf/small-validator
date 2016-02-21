declare var $

function serialAnd(objs, control) {
    objs = objs.slice()

    var retDefer = $.Deferred()

    function getNext() {
        var obj = objs.shift()

        if (obj === undefined) {
            retDefer.resolve()
            return
        }

        obj.check(control).done(() => {
            getNext()
        })
        .fail(() => {
            retDefer.reject(obj)
        })
    }
    getNext()

    return retDefer
}
function serialOr(objs, control) {
    objs = objs.slice()

    var retDefer = $.Deferred()
    var isOk = false
    var msgObj

    function getNext() {
        if (isOk) {
            retDefer.resolve()
            return
        }

        var obj = objs.shift()

        if (obj === undefined) {
            retDefer.reject(msgObj)
            return
        }

        obj.check(control).done(() => {
            isOk = true
        })
        .fail(() => {
            if (obj.msg) {
                msgObj = obj
            }
        })
        .always(() => {
            getNext()
        })
    }
    getNext()

    return retDefer
}

function parallelAnd(objs) {
    var defers = []

    $.each(objs, (_i, obj) => {
        defers.push(obj.check())
    })

    return $.when.apply(null, defers)
}

var css = {
    inputError: 'stars-input-error'
}

export {css}

export class RegRule {
    constructor(public reg: RegExp, public msg: string) { }
    check(control) {
        var defer = $.Deferred()

        if (this.reg.test(control.val())) {
            defer.resolve()
        }
        else {
            defer.reject()
        }
        return defer
    }
}

export class FuncRule {
    constructor(public func: Function, public msg: string) { }
    check(control) {
        var defer = $.Deferred()

        if (this.func(control)) {
            defer.resolve()
        }
        else {
            defer.reject()
        }
        return defer
    }
}

export class IORule {
    constructor(public url: string, public callback: Function, public msg: string, public getParamsFunc: Function = Function.prototype) { }
    check(control) {
        var me = this
        var defer = $.Deferred()
        var params = this.getParamsFunc() || {}

        var url = me.url + encodeURIComponent(control.val()) + '&t=' + (new Date).getTime()

        $.getJSON(url, params, data => {
            if (me.callback(control, data)) {
                defer.resolve()
            }
            else {
                defer.reject()
            }
        })
        .fail(() => {
            me.msg = 'request timeout'
            defer.reject()
        })

        return defer
    }
}

export class NotRule {
    constructor(public rule, public msg: string) { }
    check(control) {
        var defer = $.Deferred()

        this.rule.check(control).done(() => {
            defer.reject()
        })
        .fail(() => {
            defer.resolve()
        })

        return defer
    }
}

export class AndRule {
    msg: string = ''
    rules
    constructor(...rules) {
        this.rules = rules
    }
    add(...rules) {
        this.rules = this.rules.concat(rules)
        return this
    }
    check(control) {
        var me = this
        return serialAnd(this.rules, control).fail(rule=> {
            me.msg = rule.msg
        })
    }
}

export class OrRule extends AndRule {
    constructor(...rules) {
        super(...rules)
    }
    check(control) {
        var me = this
        return serialOr(this.rules, control).fail(rule=> {
            if (rule) {
                me.msg = rule.msg
            }
        })
    }
}

class Control {
    classType = 'control'
    $tipEle = $('<div/>')
    $event = $('<div/>')
    msg = ''
    parent = null
    display = true
    $ele = null

    constructor() { }

    onSuccess(func: Function) {
        var me = this
        this.$event.on('success', () => {
            func(me)
        })
        return me
    }
    onError(func: Function) {
        var me = this
        this.$event.on('error', () => {
            func(me)
        })
        return me
    }
    onAlways(func: Function) {
        var me = this
        this.$event.on('always', () => {
            func(me)
        })
        return me
    }
    execCallback(ret) {
        this.$event.trigger('always').trigger(ret ? 'success' : 'error')
    }

    check(isSelf?) {
        var me = this

        //如果被主动off
        //或者，元素被隐藏或删除
        if (this.display === false || (this.$ele && this.$ele.is(':hidden'))) {
            var defer = $.Deferred()
            defer.resolve()
            return defer
        }

        if (!this.parent) {
            this.clearStatus()
            return this.checkSelf()
        }
        else {
            if (isSelf) {
                return this.checkSelf()
            }
            else {
                return this.parent.check()
            }
        }
    }

    showTip(msg) {
        this.msg = msg
        this.$tipEle.html(msg).hide()
        if (msg) {
            this.$tipEle.fadeIn()
        }
        return this
    }

    checkSelf() { }
    clearStatus() { }
    bindEvents() { }
}

export class TextControl extends Control {
    $ele
    rules = []
    triggerType = 'blur'

    constructor($ele) {
        super()
        this.$ele = $($ele)
        this.initStarsEvent()
        this.bindEvents()
    }
    setTipEle($tipEle) {
        this.$tipEle = $($tipEle)
        return this
    }
    add(...rules) {
        this.rules = this.rules.concat(rules)
        return this
    }
    val(): string {
        if ((this instanceof TextControl) && this.$ele.hasClass('js-placeholder')) {
            return ''
        }
        return $.trim(this.$ele.val()) || this.$ele.attr('data-stars-value') || ''
    }
    on() {
        this.display = true
        return this
    }
    off() {
        this.display = false
        return this
    }
    initStarsEvent() {
        var $ele = this.$ele
        var flag = 'data-stars-event'

        if ($ele.attr(flag) == 'yes') {
            return false
        }

        $ele.attr(flag, 'yes')
        var events = ['blur', 'change']

        $.each(events, (_i, evt) => {
            $ele.on(evt, () => {
                $ele.trigger('stars-' + evt)
            })
        })
    }
    clearStatus() {
        this.showTip('')

        if (this instanceof TextControl) {
            this.$ele.removeClass(css.inputError)
        }
    }
    checkSelf() {
        var me = this

        var andRule = new AndRule()
        andRule.add(...this.rules)

        return andRule.check(this).done(() => {
            me.execCallback(true)
        })
        .fail(() => {
            me.execCallback(false)
        })
        .always(() => {
            me.showTip(andRule.msg)
        })
    }
    bindEvents() {
        var me = this
        var eventType = 'stars-' + me.triggerType
        me.$ele.off(eventType).on(eventType, () => {
            me.check()
        })

        if (me instanceof TextControl) {
            me.onError(() => {
                me.$ele.addClass(css.inputError)
            })
        }

        return me
    }
}

export class SelectControl extends TextControl {
    triggerType = 'change'
    constructor($ele) {
        super($ele)
    }
}

export class RadioControl extends SelectControl {
    constructor($ele) {
        super($ele)
    }
}

export class CheckboxControl extends SelectControl {
    constructor($ele) {
        super($ele)
    }
}

export class AndControl extends Control {
    controls = []

    constructor(...controls) {
        super()
        this.add(...controls)
        this.bindEvents()
    }
    add(...controls) {
        var me = this
        this.controls = this.controls.concat(controls)
        $.each(this.controls, (_i, control) => {
            control.parent = me
        })
        return this
    }
    clearStatus() {
        $(this.controls).each((_i, control) => {
            control.clearStatus()
        })
    }
    bindEvents() {
        var me = this
        me.onSuccess(() => {
            me.clearStatus()
        })
    }
    checkSelf() {
        var me = this

        return serialAnd(this.controls, true).done(() => {
            me.showTip('')
            me.execCallback(true)
        })
            .fail(control => {
                if (control) {
                    me.showTip(control.msg)
                }
                me.execCallback(false)
            })
    }
}

export class OrControl extends AndControl {
    constructor(...controls) {
        super(...controls)
    }
    checkSelf() {
        var me = this
        return serialOr(this.controls, true).done(() => {
            me.showTip('')
            me.execCallback(true)
        })
            .fail(control => {
                if (control) {
                    me.showTip(control.msg)
                }
                me.execCallback(false)
            })
    }
}

export class FormControl extends AndControl {
    constructor(...controls) {
        super(...controls)
    }
    add(...controls) {
        this.controls = this.controls.concat(controls)
        return this
    }
    check() {
        var me = this

        return parallelAnd(this.controls).done(() => {
            me.execCallback(true)
        })
            .fail(() => {
                me.execCallback(false)
            })
    }
}

export function rule(a, b, c, d): any {
    var t = $.type(a)
    if (t == 'regexp') {
        return new RegRule(a, b)
    }
    else if (t == 'function') {
        return new FuncRule(a, b)
    }
    else if (t == 'string') {
        return new IORule(a, b, c, d)
    }
    throw 'Rule error:' + a + ',' + b
}

export function not(rule, msg) {
    return new NotRule(rule, msg)
}

export function control($ele): any {
    if (!$ele) {
        return new FormControl
    }

    $ele = $($ele)

    var eleType = $ele.prop('type')
    var obj

    switch (eleType) {
        case 'radio':
            obj = new RadioControl($ele)
            break

        case 'select-one':
        case 'select-multiple':
        case 'file':
            obj = new SelectControl($ele)
            break

        case 'checkbox':
            obj = new CheckboxControl($ele)
            break

        default:
            obj = new TextControl($ele)
            break
    }

    return obj
}

function andOr(t) {
    t = (t == 'and') ? 'and' : 'or'

    var ruleMap = { 'and': AndRule, 'or': OrRule }
    var controlMap = { 'and': AndControl, 'or': OrControl }

    var fn = function(...args) {
        var obj

        if (!args.length) {
            return new controlMap[t]
        }

        if (args[0].classType == 'control') {
            obj = new controlMap[t]
        }
        else {
            obj = new ruleMap[t]
        }

        obj.add(...args)
        return obj
    }

    return fn
}

export function required(msg) {
    function func(control) {
        var $ele = control.$ele
        var eleType = $ele.prop('type')

        if (eleType == 'checkbox' || eleType == 'radio') {
            return $ele.prop('checked')
        }
        else if (eleType == 'select-one') {
            var value = control.val()
            return (value != '-1') && (value != '')
        }
        else if (eleType == 'file') {
            return $ele[0].files.length != 0
        }
        else {
            return $.trim(control.val()) != ''
        }
    }
    return new FuncRule(func, msg)
}

export function length(range, msg) {
    var min = parseInt(range[0])
    var max = parseInt(range[1])

    if (isNaN(min) && isNaN(max)) {
        throw 'length error'
    }

    function func(control) {
        var $ele = control.$ele
        var len = $.trim($ele.val()).length

        if (!isNaN(min) && !isNaN(max)) {
            return (len >= min) && (len <= max)
        }
        if (isNaN(min)) {
            return len < max
        }
        return len >= min
    }

    return new FuncRule(func, msg)
}

export function any($eles, msg) {
    $eles = $($eles)
    var orControlObj = new OrControl

    $eles.each(() => {
        var me = $(this)
        orControlObj.add(control(me).add(required(msg)))
    })

    return orControlObj
}