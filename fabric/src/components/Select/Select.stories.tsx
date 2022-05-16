import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Select } from '.'

export default {
  title: 'Components/Select',
  component: Select,
} as ComponentMeta<typeof Select>

type SelectStory = ComponentStory<typeof Select>
const Template: SelectStory = (args) => (
  <Select
    {...args}
    options={[
      {
        label: 'Option 1',
        value: 'a',
      },
      {
        label: 'Option 2',
        value: 'b',
      },
      {
        label: 'Option 2',
        value: 'c',
      },
    ]}
    value="a"
    onSelect={console.log}
  />
)

export const Default = Template.bind({})
Default.args = {
  placeholder: 'Select something',
  label: 'Label',
  errorMessage: '',
  disabled: false,
}
