import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Button } from '../components/Button'

export default {
  title: 'Test/Button',
  component: Button,
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = (args) => <Button {...args}>Connect</Button>

export const DefaultBackground = Template.bind({})
DefaultBackground.args = {
  m: 'large',
}

export const Lime = Template.bind({})
Lime.args = {
  m: 'large',
  bg: 'brandLime',
}

export const Blue = Template.bind({})
Blue.args = {
  m: 'xxlarge',
  bg: 'brandBlue',
}
