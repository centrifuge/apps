import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Stack } from '.'
import { Box } from '../Box'

export default {
  title: 'Components/Stack',
  component: Stack,
  argTypes: {
    alignItems: {
      options: ['stretch', 'center', 'flex-start', 'flex-end'],
      control: { type: 'select' },
    },
  },
} as ComponentMeta<typeof Stack>

type StackStory = ComponentStory<typeof Stack>
const Template: StackStory = (args) => (
  <Stack {...args}>
    <Box backgroundColor="brand" minWidth={200} height={75} />
    <Box backgroundColor="brand" minWidth={150} height={75} />
    <Box backgroundColor="brand" minWidth={250} height={75} />
  </Stack>
)

export const Default = Template.bind({})
Default.args = {
  gap: 2,
  alignItems: 'stretch',
}
