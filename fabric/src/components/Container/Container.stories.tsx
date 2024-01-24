import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { Container } from '.'
import { Box } from '../Box'

export default {
  title: 'Components/Container',
  component: Container,
} as Meta<typeof Container>

type ContainerStory = StoryFn<typeof Container>
const Template: ContainerStory = (args) => (
  <Container {...args}>
    <Box backgroundColor="accentPrimary" width="100%" height={75} />
  </Container>
)

export const Default = Template.bind({})
