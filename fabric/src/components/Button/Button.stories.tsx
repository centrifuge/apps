import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { AnchorButton as AnchorButtonComp, Button as ButtonComp } from '.'
import { IconChevronDown, IconClock } from '../../icon'
import { Grid } from '../Grid'
import { Shelf } from '../Shelf'
import { WalletButton as WalletButtonComp } from './WalletButton'

export default {
  title: 'Components/Button',
  component: ButtonComp,
} as ComponentMeta<typeof ButtonComp>

type ButtonStory = ComponentStory<typeof ButtonComp>
type AnchorButtonStory = ComponentStory<typeof AnchorButtonComp>
type WalletButtonStory = ComponentStory<typeof WalletButtonComp>

const Template: ButtonStory = (args): React.ReactElement => (
  <Grid columns={5} gap={3} justifyItems="start" maxWidth={800} equalColumns>
    {(['primary', 'secondary', 'tertiary'] as const).flatMap((variant) =>
      [false, true].map((small) => (
        <React.Fragment key={`${small}-${variant}`}>
          <ButtonComp {...args} variant={variant} small={small}>
            Connect
          </ButtonComp>
          <ButtonComp {...args} variant={variant} small={small} icon={IconClock}>
            Connect
          </ButtonComp>
          <ButtonComp {...args} variant={variant} small={small} iconRight={IconChevronDown}>
            Connect
          </ButtonComp>
          <ButtonComp {...args} variant={variant} small={small} icon={IconClock} iconRight={IconChevronDown}>
            Connect
          </ButtonComp>
          <ButtonComp {...args} variant={variant} small={small} icon={IconClock} />
        </React.Fragment>
      ))
    )}
  </Grid>
)

export const Button: ButtonStory = Template.bind({})
Button.args = {
  disabled: false,
  loading: false,
}

export const AnchorButton: AnchorButtonStory = (args) => (
  <Shelf gap={3}>
    <AnchorButtonComp {...args} target="_blank">
      External link
    </AnchorButtonComp>
    <AnchorButtonComp {...args} target="_blank" variant="secondary">
      External link
    </AnchorButtonComp>
    <AnchorButtonComp {...args} target="_blank" variant="tertiary">
      External link
    </AnchorButtonComp>
  </Shelf>
)
AnchorButton.args = {
  disabled: false,
  loading: false,
  active: false,
  href: 'https://centrifuge.io',
}

export const WalletButton: WalletButtonStory = (args) => (
  <Grid columns={3} gap={3} justifyItems="stretch" equalColumns>
    <WalletButtonComp {...args} />
    <WalletButtonComp {...args} address="kAMx1vYzEvumnpGcd6a5JL6RPE2oerbr6pZszKPFPZby2gLLF" balance="100 kUSD" />
    <WalletButtonComp
      {...args}
      address="kAMx1vYzEvumnpGcd6a5JL6RPE2oerbr6pZszKPFPZby2gLLF"
      alias="Alice"
      balance="100 kUSD"
    />
  </Grid>
)
WalletButton.args = {
  disabled: false,
  loading: false,
  active: false,
}
