import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Button } from '../components/Button'

export default {
  title: 'Components/Button',
  component: Button,
} as ComponentMeta<typeof Button>

type ButtonStory = ComponentStory<typeof Button>

const Template: ButtonStory = (args) => <Button {...args}>Connect</Button>

export const DefaultType: ButtonStory = Template.bind({})
DefaultType.args = {}

export const Contained: ButtonStory = Template.bind({})
Contained.args = {
  contained: true,
}

export const Outlined: ButtonStory = Template.bind({})
Outlined.args = {
  outlined: true,
}

export const Text: ButtonStory = Template.bind({})
Text.args = {
  text: true,
}

export const ContainedSmall: ButtonStory = Template.bind({})
ContainedSmall.args = {
  contained: true,
  small: true,
}

export const ContainedDisabled: ButtonStory = Template.bind({})
ContainedDisabled.args = {
  contained: true,
  disabled: true,
}
