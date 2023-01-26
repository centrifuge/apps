import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { RangeInput } from '.'

export default {
  title: 'Components/RangeInput',
  component: RangeInput,
} as ComponentMeta<typeof RangeInput>

type RangeInputStory = ComponentStory<typeof RangeInput>
const Template: RangeInputStory = (args) => <RangeInput {...args} />

export const Default = Template.bind({})
Default.args = {
  label: 'Label',
  secondaryLabel: 'Label',
  errorMessage: '',
  disabled: false,
}
