import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { InteractiveCard } from '.'
import { Text } from '../Text'
import { Thumbnail } from '../Thumbnail'

export default {
  title: 'Components/InteractiveCard',
  component: InteractiveCard,
} as ComponentMeta<typeof InteractiveCard>

type InteractiveCardStory = ComponentStory<typeof InteractiveCard>
const Template: InteractiveCardStory = (args) => (
  <InteractiveCard
    {...args}
    maxWidth={600}
    icon={<Thumbnail label="1" type="asset" />}
    title="Card title"
    titleAddition="Title addition"
    secondaryHeader={<Text>Lorem ipsum, dolor sit amet consectetur adipisicing elit.</Text>}
  >
    <Text>
      Lorem ipsum, dolor sit amet consectetur adipisicing elit. Eum, quam consectetur non tempore amet esse mollitia
      maiores rerum exercitationem dolore sapiente alias porro! Quasi explicabo praesentium eos culpa ipsa? Alias!
    </Text>
  </InteractiveCard>
)

export const Default = Template.bind({})
Default.args = {}
