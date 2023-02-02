import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Toast } from '.'
import { IconExternalLink } from '../..'
import { Button } from '../Button'
import { Stack } from '../Stack'

export default {
  title: 'Components/Toast',
  component: Toast,
} as ComponentMeta<typeof Toast>

type ToastStory = ComponentStory<typeof Toast>
const Template: ToastStory = (args) => (
  <Stack gap={4}>
    {['info', 'pending', 'ok', 'warning', 'critical'].map((status) => (
      <Toast
        {...args}
        status={status as any}
        action={<Button variant="tertiary" icon={IconExternalLink} />}
        key={status}
      />
    ))}
  </Stack>
)

export const Default = Template.bind({})
Default.args = {
  label: 'Toast label',
  sublabel: 'Toast sublabel',
}
