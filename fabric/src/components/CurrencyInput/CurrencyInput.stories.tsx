import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { CurrencyInput } from '.'

export default {
  title: 'Components/CurrencyInput',
  component: CurrencyInput,
} as Meta<typeof CurrencyInput>

type CurrencyInputStory = StoryFn<typeof CurrencyInput>
const Template: CurrencyInputStory = (args) => {
  const [value, setValue] = React.useState<number | ''>(123456.789)
  return <CurrencyInput {...args} value={value} onChange={setValue} />
}

export const Default = Template.bind({})
Default.args = {
  placeholder: '0.0',
  label: 'Amount',
  secondaryLabel: '123,456.00 kUSD balance',
  errorMessage: '',
  disabled: false,
  currency: 'kUSD',
  onChange: () => {},
  onSetMax: () => {},
}
