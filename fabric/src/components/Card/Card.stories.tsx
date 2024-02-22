import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { Card } from '.'
import { Text } from '../Text'

export default {
  title: 'Components/Card',
  component: Card,
} as Meta<typeof Card>

type CardStory = StoryFn<typeof Card>
const Template: CardStory = (args) => (
  <Card {...args} maxWidth={600}>
    <Text>
      Lorem ipsum, dolor sit amet consectetur adipisicing elit. Eum, quam consectetur non tempore amet esse mollitia
      maiores rerum exercitationem dolore sapiente alias porro! Quasi explicabo praesentium eos culpa ipsa? Alias!
    </Text>
  </Card>
)

export const Default = Template.bind({})
Default.args = {
  p: 3,
  interactive: false,
}
