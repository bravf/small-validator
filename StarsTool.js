/*
 * bravfing@126.com
 * 2014.6.11
 */
StarsTool = function (){
    var rulesTable = {
        phone : /^1[0-9]{10}$/,
        number : /^\d+$/
    }

    return {
        get : function (form){
            var me = this
            var $form = $(form)
            var formControl = Stars.control($form)

            $form.find('*[data-stars-rules]').each(function (){
                var controlObj = me.getControlObj($(this))
                formControl.add(controlObj)
            })

            return formControl
        },
        getControlObj : function ($element){
            var me = this
            var rules = $element.attr('data-stars-rules').split(' ')
            var ruleMsg = $element.attr('data-stars-msg')
            var ruleTipEle = $element.attr('data-stars-tipEle')

            var controlObj = Stars.control($element)
            if (ruleTipEle){
                controlObj.setTipEle(ruleTipEle)
            }

            var andRuleObj = new Stars.AndRule()
            var hasEmpty = false

            $(rules).each(function (){
                var rule

                if (this=='empty'){
                    hasEmpty = true
                    return
                }

                var arr = this.split('_')

                //规则判断
                if (this=='required'){
                    rule = Stars.required(ruleMsg)
                }
                else if (this.slice(0, 5)=='range'){
                    rule = Stars.length([arr[1], arr[2]], ruleMsg)
                }
                else if (this.slice(0, 6)=='regexp'){
                    try{
                        var regexp = new RegExp(arr[1])
                        rule = Stars.rule(regexp, ruleMsg)
                    }
                    catch(ex){}
                }
                else if (this.slice(0, 4)=='same'){
                    rule = Stars.rule(function (control){
                        return control.val() == $(arr[1]).val()
                    }, ruleMsg)
                }
                else {
                    rule = Stars.rule(rulesTable[this], ruleMsg)
                }

                andRuleObj.add(rule)
            })

            //如果有empty
            if (hasEmpty){
                var orRuleObj = new Stars.OrRule()
                orRuleObj.add(Stars.not(Stars.required()))
                orRuleObj.add(andRuleObj)
                controlObj.add(orRuleObj)
            }
            else {
                controlObj.add(andRuleObj)
            }
            return controlObj
        }
    }
}()