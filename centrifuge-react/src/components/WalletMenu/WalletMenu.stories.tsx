import { Box } from '@centrifuge/fabric'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { WalletMenu } from '.'

export default {
  title: 'Components/WalletMenu',
  component: WalletMenu,
} as ComponentMeta<typeof WalletMenu>

type WalletMenuStory = ComponentStory<typeof WalletMenu>
const Template: WalletMenuStory = () => (
  <Box maxWidth={300}>
    <WalletMenu />
  </Box>
)

export const Default = Template.bind({})
