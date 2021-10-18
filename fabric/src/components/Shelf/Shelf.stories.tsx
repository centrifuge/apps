import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Shelf } from '.'
import { Box } from '../Box'

export default {
  title: 'Components/Shelf',
  component: Shelf,
  argTypes: {
    alignItems: {
      options: ['stretch', 'center', 'flex-start', 'flex-end'],
      control: { type: 'select' },
    },
  },
} as ComponentMeta<typeof Shelf>

type ShelfStory = ComponentStory<typeof Shelf>
const Template: ShelfStory = (args) => (
  <Shelf {...args}>
    <Box backgroundColor="brand" width={200} minHeight={75} />
    <Box backgroundColor="brand" width={200} minHeight={50} />
    <Box backgroundColor="brand" width={200} minHeight={60} />
  </Shelf>
)

export const Default = Template.bind({})
Default.args = {
  gap: 2,
  alignItems: 'center',
}
