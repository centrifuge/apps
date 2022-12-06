import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Checkbox } from '.'
import { Stack } from '../Stack'
import { Text } from '../Text'

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
} as ComponentMeta<typeof Checkbox>

type CheckboxStory = ComponentStory<typeof Checkbox>
const Template: CheckboxStory = (args) => (
  <Stack gap={3}>
    <Checkbox {...args} />
    <Checkbox
      {...args}
      label="A very long multiline label. Sit voluptatem repellendus minus magni blanditiis et numquam quo. A nemo et rerum quia consequatur dicta corrupti. Minus accusamus non iusto aut sint praesentium. Id alias voluptatum omnis cupiditate. Repudiandae ut recusandae veniam cupiditate ea blanditiis. "
    />
    <Checkbox {...args} label={<Text>A sample label</Text>} />
  </Stack>
)

export const Default = Template.bind({})
Default.args = {
  label: 'Label',
  disabled: false,
}
