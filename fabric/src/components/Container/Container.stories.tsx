import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Container } from '.'
import { Box } from '../Box'

export default {
  title: 'Components/Container',
  component: Container,
} as ComponentMeta<typeof Container>

type ContainerStory = ComponentStory<typeof Container>
const Template: ContainerStory = (args) => (
  <Container {...args}>
    <Box backgroundColor="brand" width="100%" height={75} />
  </Container>
)

export const Default = Template.bind({})
