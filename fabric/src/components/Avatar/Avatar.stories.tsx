import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Avatar } from '.'
import { Shelf } from '../Shelf'

export default {
  title: 'Components/Avatar',
  component: Avatar,
} as ComponentMeta<typeof Avatar>

type AvatarStory = ComponentStory<typeof Avatar>
const Template: AvatarStory = (args) => (
  <Shelf>
    <Avatar {...args} />
  </Shelf>
)

export const Default = Template.bind({})
Default.args = {
  label: 'TP2SEN',
  size: 'small',
  type: 'token',
}
