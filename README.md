#SmallValidator, you need it!

###Import mode:

```
//script link
<script src="small-validator.js"></script>

//commonjs
var SmallValidator = require('small-validator.js')

//amd
define(['small-validator.js'], function (){
})
```

###Sometimes, we have a user form like this:
```
<form class="js-test-form">
    <input type="text" class="js-user"/>
    <div class="js-user-tip"></div>
    
    <input type="password" class="js-password">
    <div class="js-password-tip"></div>
    
    <button class="js-submit-btn">提交</button>
</form>
```

###We can valid the form with ```small-validator```:

```
var SmallValidator = require('small-validator.js')
var formControl = new SmallValidator.control()

//############################################################
var userControl = SmallValidator.control('.js-user').setTipEle('.js-user-tip')
var notEmptyRule = SmallValidator.required('username is required')
var lengthRule = SmallValidator.rule(/^*{5,8}$/, 'username length should in 5..8')
var userExistsRule  = SmallValidator.rule('userExists.php', function (control, data){
    if (data.exist){
        return false
    }
    else {
        return true
    }
}, 'user already exist')
userControl.add(notEmptyRule, lengthRule, userExistsRule)

//############################################################
var passControl = SmallValidator.control('.js-password').setTipEle('.js-password-tip')
var notEmptyRule = SmallValidator.required('password is required')
var lengthRule = SmallValidator.rule(function (control){
    var value = control.val()
    return /^\d{5,8}$/.test(value)
}, 'password length should in 5..8 and all chars should be number')
passControl.add(notEmptyRule, lengthRule)

//############################################################
formControl.add(userControl, passControl)

$('.js-submit-btn').on('click', function (){
    formControl.check().done(function (){
        //when valid ok
    })
    .fail(function (){
        //when valid fail
    })
})
```
###Actually, a more simple style:
```
var formControl

with (SmallValidator){
    formControl = control().add(
        
        control('.js-user')
        .setTipEle('.js-user-tip')
        .add(
            required('user is required'),
            length([5, 8], 'username length should in 5..8'),
            rule('userExists.php', function (control, data){
                if (data.exist){
                    return false
                }
                else {
                    return true
                }
            }, 'user already exist')
        ),
        
        control('.js-password')
        .setTipEle('.js-password-tip')
        .add(
            required('password is required'),
            rule(/^\d{5,8}$/, 'password length should in 5..8 and all chars should be number')
        )
    )
}
```

##Read soure code and enjoy it!
