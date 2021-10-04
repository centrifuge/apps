import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Button } from '../components/Button'

export default {
  title: 'Components/Button',
  component: Button,
} as ComponentMeta<typeof Button>

type ButtonStory = ComponentStory<typeof Button>

const Template: ButtonStory = (args) => <Button {...args}>Connect</Button>

export const DefaultBackground: ButtonStory = Template.bind({})
DefaultBackground.args = {
  m: 'large',
}

export const CentrifugeBlue: ButtonStory = Template.bind({})
CentrifugeBlue.args = {
  m: 'large',
  bg: 'centrifugeBlue',
}

export const AltairYellow: ButtonStory = Template.bind({})
AltairYellow.args = {
  m: 'xxlarge',
  bg: 'altairYellow',
}
