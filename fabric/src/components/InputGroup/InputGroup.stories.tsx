import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { InputGroup } from '.'
import { Checkbox } from '../Checkbox'
import { RadioButton } from '../RadioButton'
import { Stack } from '../Stack'

export default {
  title: 'Components/InputGroup',
  component: InputGroup,
} as ComponentMeta<typeof InputGroup>

type InputGroupStory = ComponentStory<typeof InputGroup>
const Template: InputGroupStory = (args) => (
  <Stack gap={3}>
    <InputGroup {...args}>
      <RadioButton name="group2" label="Option 1" disabled={args.disabled} />
      <RadioButton name="group2" label="Option 2" disabled={args.disabled} />
      <RadioButton name="group2" label="Option 3" disabled={args.disabled} />
    </InputGroup>
    <InputGroup {...args}>
      <Checkbox label="Option 1" disabled={args.disabled} />
      <Checkbox label="Option 2" disabled={args.disabled} />
      <Checkbox label="Option 3" disabled={args.disabled} />
    </InputGroup>
  </Stack>
)

export const Default = Template.bind({})
Default.args = {
  label: 'Label',
  errorMessage: '',
  disabled: false,
}
