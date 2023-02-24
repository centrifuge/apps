import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Spinner } from '.'
import { baseTheme } from '../../theme/tokens/baseTheme'
import { Box } from '../Box'
import { Stack } from '../Stack'

export default {
  title: 'Components/Spinner',
  component: Spinner,
} as ComponentMeta<typeof Spinner>

type SpinnerStory = ComponentStory<typeof Spinner>
const Template: SpinnerStory = () => {
  const sizes = [
    baseTheme.sizes.iconSmall,
    baseTheme.sizes.iconMedium,
    baseTheme.sizes.iconRegular,
    baseTheme.sizes.iconLarge,
  ]

  return (
    <Stack>
      {sizes.map((size) => (
        <Box key={size}>
          <Spinner size={size} />
        </Box>
      ))}
    </Stack>
  )
}

export const Default = Template.bind({})
