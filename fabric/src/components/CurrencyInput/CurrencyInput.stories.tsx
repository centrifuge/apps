import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { CurrencyInput } from '.'

export default {
  title: 'Components/CurrencyInput',
  component: CurrencyInput,
} as ComponentMeta<typeof CurrencyInput>

type CurrencyInputStory = ComponentStory<typeof CurrencyInput>
const Template: CurrencyInputStory = (args) => <CurrencyInput {...args} />

export const Default = Template.bind({})
Default.args = {
  placeholder: '0.0',
  label: 'Amount',
  secondaryLabel: '123,456.00 kUSD balance',
  errorMessage: '',
  disabled: false,
  currency: 'kUSD',
  value: 123456.0,
  onChange: () => {},
  onSetMax: () => {},
}
