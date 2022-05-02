import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { RadioButton } from '.'
import { Stack } from '../Stack'

export default {
  title: 'Components/RadioButton',
  component: RadioButton,
} as ComponentMeta<typeof RadioButton>

type RadioButtonStory = ComponentStory<typeof RadioButton>
const Template: RadioButtonStory = (args) => (
  <Stack gap={3}>
    <RadioButton {...args} name="group1" />
    <RadioButton
      {...args}
      label="A very long multiline label. Sit voluptatem repellendus minus magni blanditiis et numquam quo. A nemo et rerum quia consequatur dicta corrupti. Minus accusamus non iusto aut sint praesentium. Id alias voluptatum omnis cupiditate. Repudiandae ut recusandae veniam cupiditate ea blanditiis."
      name="group1"
    />
  </Stack>
)

export const Default = Template.bind({})
Default.args = {
  label: 'Label',
  errorMessage: '',
  disabled: false,
}
