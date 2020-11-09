import { defineParameterType } from '@cucumber/cucumber'

defineParameterType({
  regexp: /invest|redeem/,
  transformer: (s: string) => {
    return s
  },
  name: 'order',
})

defineParameterType({
  regexp: /DROP|TIN/,
  transformer: (s: string) => {
    return s
  },
  name: 'tranche',
})