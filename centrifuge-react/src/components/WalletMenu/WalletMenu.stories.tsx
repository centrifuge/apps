import { Box } from '@centrifuge/fabric'
import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { WalletMenu } from '.'

export default {
  title: 'Components/WalletMenu',
  component: WalletMenu,
} as Meta<typeof WalletMenu>

type WalletMenuStory = StoryFn<typeof WalletMenu>
const Template: WalletMenuStory = () => (
  <Box maxWidth={300}>
    <WalletMenu />
  </Box>
)

export const Default = Template.bind({})
