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

export const CentrifugeBlue = Template.bind({})
CentrifugeBlue.args = {
  m: 'large',
  bg: 'centrifugeBlue',
}

export const AltairYellow = Template.bind({})
AltairYellow.args = {
  m: 'xxlarge',
  bg: 'altairYellow',
}
