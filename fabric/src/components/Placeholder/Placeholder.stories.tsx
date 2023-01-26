import { ComponentMeta } from '@storybook/react'
import * as React from 'react'
import { Placeholder } from '.'
import { Stack } from '../Stack'

export default {
  title: 'Components/Placeholder',
  component: Placeholder,
} as ComponentMeta<typeof Placeholder>

export const Default = () => (
  <Stack gap={2} width={500} maxWidth="100%">
    <Placeholder alignSelf="center" width="150px" aspectRatio="1 / 1" borderRadius="50%" />
    <Placeholder width="100%" height="10px" />
    <Placeholder width="100%" height="50px" borderRadius="6px" />
    <Placeholder aspectRatio="16 / 9" borderRadius="24px" />
  </Stack>
)
