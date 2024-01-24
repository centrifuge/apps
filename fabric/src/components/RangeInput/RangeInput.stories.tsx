import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { RangeInput } from '.'

export default {
  title: 'Components/RangeInput',
  component: RangeInput,
} as Meta<typeof RangeInput>

type RangeInputStory = StoryFn<typeof RangeInput>
const Template: RangeInputStory = (args) => <RangeInput {...args} />

export const Default = Template.bind({})
Default.args = {
  label: 'Label',
  secondaryLabel: 'Label',
  errorMessage: '',
  disabled: false,
}
