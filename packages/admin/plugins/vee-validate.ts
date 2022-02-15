import { extend } from 'vee-validate'
import * as rules from 'vee-validate/dist/rules'
import { messages } from 'vee-validate/dist/locale/ru.json'
import { isUsername, IS_USERNAME, IS_USERNAME_OR_EMAIL } from 'unicore-common/dist/validation/index'

for (let [rule, validation] of Object.entries(rules)) {
  extend(rule, {
    ...validation,
    // @ts-ignore
    message: messages[rule],
  })
}

extend(IS_USERNAME, {
  validate(value) {
    return isUsername(value)
  },
  message: 'Некоретное имя пользователя',
})

extend(IS_USERNAME_OR_EMAIL, {
  validate(value) {
    return isUsername(value) || rules.email.validate(value)
  },
  message: 'Некоретный Email или Имя пользователя',
})