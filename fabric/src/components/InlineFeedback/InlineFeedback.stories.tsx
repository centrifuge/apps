import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { InlineFeedback } from '.'
import { Stack } from '../Stack'

export default {
  title: 'Components/InlineFeedback',
  component: InlineFeedback,
} as ComponentMeta<typeof InlineFeedback>

type InlineFeedbackStory = ComponentStory<typeof InlineFeedback>
const Template: InlineFeedbackStory = (args) => (
  <Stack gap={3}>
    <InlineFeedback {...args}>Short inline feedback message</InlineFeedback>
    <InlineFeedback {...args}>
      A very long multiline feedback message. Sit voluptatem repellendus minus magni blanditiis et numquam quo. A nemo
      et rerum quia consequatur dicta corrupti. Minus accusamus non iusto aut sint praesentium. Id alias voluptatum
      omnis cupiditate. Repudiandae ut recusandae veniam cupiditate ea blanditiis.
    </InlineFeedback>
  </Stack>
)

export const Default = Template.bind({})
Default.args = {}
