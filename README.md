# 前端验证框架Stars

标签（空格分隔）： javascript

---

## 牛刀也可杀鸡

先看一个常见的表单验证
```
<div class="test-form" data-Stars-type="form">
    <div class="box">
        <input type="text" data-Stars-rules="required" data-Stars-msg="必填" data-Stars-tipEle=".msg1" placeholder="必填"/>
        <div class="msg msg1"></div>
    </div>
    <div class="box">
        <input type="text" data-Stars-rules="empty phone" data-Stars-msg="请填写正确的手机号" data-Stars-tipEle=".msg2" placeholder="手机号(可为空)"/>
        <div class="msg msg2"></div>
    </div>
    <div class="box">
        <input type="text" data-Stars-rules="number range_5_11" data-Stars-msg="请填写5到10个数字" placeholder="5到10个数字"/>
    </div>
    <div class="box">
        <input type="text" data-Stars-rules="regexp_^[a-z]{3,5}$" data-Stars-msg="请填写3-5个字母" placeholder="3到5个字母"/>
    </div>
    <button id="btn">提交</button>
</div>
```
上面的表单是一个很简单的表单，验证规则也并不复杂，大家都看得懂，用下边的代码就能实现对这个表单进行前端的验证
```
<script src="jquery.js"></script>
<script src="Stars.js"></script>
<script src="StarsTool.js"></script>

<script>
var formControl = StarsTool.get('.test-form')
$('#btn').on('click', function (){
    alert(formControl.check())
})
</script>
```
验证规则都写到相应的元素上，然后一行代码搞定，目前圈子里大部分的验证框架都这么搞，无非是data-Stars-rules里定制了更多的枚举rule，支持什么email,qq,url啥的，这个无非就是扩展StarsTool里的rulesTable，没什么新意。

而且由于每个人、每个项目、每个公司对这些rule的理解并不相同，比如手机号，有人觉得是11个数字就好了，有人则必须135，158什么的一大堆，所以我强烈建议大家根据自己的实际情况去构造自己的rulesTable，直接改StarsTool的代码即可。

所以简单情况下，大家其实都只是维护了个规则表而已。最多无非就像StarsTool支持常用的empty、required、length、regexp罢了。

如果你的工作中遇到的只是这种强度的表单，那么看到这里基本就够了。

## 牛刀当然还是要用来宰牛

还是先看个例子
```
<p class="words">请提交您的退款原因，以便我们改进服务（至少选一项）</p>

<input type="checkbox" class="Qt_checkbox " value="1"/>预约不上
<input type="checkbox" class="Qt_checkbox " value="2"/>计划有变，没时间消费
<input type="checkbox" class="Qt_checkbox reason-other" value="8"/>其它
<textarea class="Qt_textb reason-other-txt" style="display:none"></textarea>

<div class="notice reason-notice" style="display:none"></div>
```
需求是`至少选中一项，如果选中了other，则在textarea中填入1-400个字`，可以考虑下，如果让你写，你会怎么写这个验证逻辑，要注意用户在上面的每个操作都要给出即时的反馈，并显示在notice中。

这样的情况用上面的`牛刀杀鸡`模式恐怕不行了吧？ok，如果放在以前我会和大家一样写一个大的function，然后在function里给所有的元素绑定相应的事件，当事件发生时候判断当时的状态，再把相应的tip写到notice中。确实能解决问题，无非就是又臭又长嘛，来看看Stars是怎么干的
```
var tips = [
    '请至少选择一张骆驼券',
    '提出您的宝贵意见，1~400个字',
    '请至少选择一种退款原因'
]
var $otherReasonTxt = $('.reason-other-txt')
var $reasonList = $('input')
var $other = $('.reason-other')

with (Stars){
    myform.add(
        //下面两个情况要同时满足
        and(
            //至少选一个
            any($reasonList, tips[2]),
            //下面规则至少满足一个
            or(
                //$other没选中
                control($other).add(not(required())),
                //下面两个情况要同时满足
                and(
                    //$other选中
                    control($other).add(required(tips[1])),
                    //$otherReasonTxt内容长度在1-400，length前闭后开
                    control($otherReasonTxt).add(length([1, 401], tips[1]))
                )
            )
        //设置提示的位置
        ).setTipEle('.reason-notice')
    )
}
```

再和你写的function对比一下，无须多言。

正当我们沉浸在思考当中，PM来了（准没好事），果然，PM觉得富文本的提示语有些过于简单，希望可以个性化提示：当内容为空的时候提示请填写，当字数超出时候提示字数超出，而且丧心病狂的要求内容只能包含字母！！！，恩，确实很变态，如果你还在写function，估计想死的心都有了。我们来看看Stars如何拯救这帮整天瞎扯淡的PM

```
control($otherReasonTxt).add(
    required('不能为空'),
    rule(/^[a-zA-Z]+$/, '内容只能包含英文字母'),
    length([1, 401], '内容长度在1-400之间')
)
```

呵呵，so easy！1分钟后你愉快的去刷weibo了，PM还以为你在改你那个大的function呢。

好景不长，刚刷了30分钟weibo，PM又来了，他大概觉得刚才的需求你应该完成了，确实，就算你在维护一个大function，也该差不多了，其实你只花了1分钟，然后刷了半个小时weibo。

这次他的需求是在上面的表单前边加一个checkbox，当选中这个checkbox时候才验证下边的表单

```
<input type="checkbox" id="myCB"/>是外星人？
```

ok，他只希望对外星人收集下边的表单资料。话不多说，PM刚离开还没回到工位，Stars就写出了下边的代码
```
var $myCB = $('#myCB')
with (Stars){
    myform.add(
        or(
            //要么不是外星人(没选中)
            control($myCB).add(not(required())),
            and(
                //要么是外星人(选中)
                control($myCB).add(required()),
                //下面两个情况要同时满足
                and(
                    //至少选一个
                    any($reasonList, tips[2]),
                    //下面规则至少满足一个
                    or(
                        //$other没选中
                        control($other).add(not(required())),
                        //下面两个情况要同时满足
                        and(
                            //$other选中
                            control($other).add(required(tips[1])),
                            //$otherReasonTxt内容长度在1-400，length前闭后开
                            control($otherReasonTxt).add(length([1, 401], tips[1]))
                        )
                    )
                )
            )
        )
        //设置提示的位置
        .setTipEle('.reason-notice')
    )
}
```

注意11-26行跟我们上面的代码是一摸一样的，你只不过加了4-9行这几行代码，以前写过的逻辑完全不用动。于是你又去刷微博了。。。

如果你还在维护function，简直无法想象嘛，估计你要砍死PM几十次了。

##牛刀为什么这么牛

牛逼的你应该已经有些门道了，其实当你看到Stars的写法，你就应该明白这到底是个什么东西了，其实大部分问题，如果难以解决，基本上是因为难以描述。一旦你找到一种合适的方式来描述问题，那么问题就迎刃而解。

Stars就是如此，灵感其实来源于四则运算或者正则表达式。

前端验证的困惑在于总是存在更加复杂的情况，表单元素与元素之间互相关联，规则和规则之间相互关联，如果不能找到一种方式来描述这些关联，那我们只能像史前时代一样写一个巨大无比的function，来手动管理这些东西，伴随而来的是无尽的痛苦。

想象一下你在处理服务器日志，有人用正则三下五除二搞完和妹子去约会了，而你还在一坨if一坨for的逐字符处理。不可同日而语。

Stars通过构建一些底层物件来让你写出一行正则走天下的感觉
```
Control:
    FormControl
    TextControl
    RadioControl
    SelectControl
    CheckboxControl
    AndControl
    OrControl

Rule:
    RegRule
    FuncRule
    NotRule
    AndRule
    OrRule
```
里边`and,or,not`开头的表示逻辑上的`与或非`，用来组合BaseControl或者BaseRule，有了积木有了组合器，你可以把任何表单逻辑映射到Stars代码。

上面的2组类也是Stars最重要的底层，control类定义了表单元素的最小单元，rule类定义了规则的最小单元，然后and、or、not又定义了组合的最小单元。你大概能想到这样一个场面吧(((1+2)-3)/4)*5，Stars无非就是这样一个东西在前端验证上的一个映射。

这些核心很重要，但是想要写出上面那种华丽的代码，还需要一些语法糖

```
rule : rule,
not : not,
control : control,
and : andOr('and'),
or : andOr('or'),
required : required,
length : length,
any : any
```

Stars还暴露了这些方法，大概也可以猜出来什么意思，比如rule方法会自动根据参数转换为相应的xxRule对象，control会自动根据参数转换为相应xxControl对象，其他莫不如此。

##关于牛刀

上面说了这么多，也就仅仅是介绍了Stars能干啥，干的好不好，以及为啥干的好。强烈建议整天和表单打交道的同学去了解一下，去尝试一下，看到底能不能解决你的问题，能不能让你远离验证时候的痛苦。说他是牛刀，听起来很唬人，其实他很轻量很苗条，压缩前还不到20K，就几百行代码。

在这里你可以了解他的全部 [Stars](https://gitcafe.com/bravf/Stars)

有问题可以随时咨询我
qq: 765621103
email: bravfing@126.com


