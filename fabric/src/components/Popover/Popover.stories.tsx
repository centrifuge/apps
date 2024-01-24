import { Meta } from '@storybook/react'
import * as React from 'react'
import { Popover } from '.'
import { Box } from '../Box'
import { Button } from '../Button'
import { Text } from '../Text'

export default {
  title: 'Components/Popover',
  component: Popover,
} as Meta<typeof Popover>

export const Default = () => (
  <Popover
    renderTrigger={(props, ref, state) => (
      <span ref={ref}>
        <Button {...props} active={state.isOpen}>
          Popover trigger
        </Button>
      </span>
    )}
    renderContent={(props, ref) => (
      <Box {...props} ref={ref} p={3} backgroundColor="backgroundSecondary">
        <Text>Popover content</Text>
      </Box>
    )}
  />
)
