import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { AnchorButton as AnchorButtonComp, Button as ButtonComp } from '.'
import { IconChevronDown, IconClock } from '../../icon'
import { Grid } from '../Grid'
import { Shelf } from '../Shelf'

export default {
  title: 'Components/Button',
  component: ButtonComp,
} as ComponentMeta<typeof ButtonComp>

type ButtonStory = ComponentStory<typeof ButtonComp>
type AnchorButtonStory = ComponentStory<typeof AnchorButtonComp>

const Template: ButtonStory = (args): React.ReactElement => (
  <Grid columns={5} gap={3} justifyItems="start" maxWidth={800} equalColumns>
    {(['contained', 'outlined', 'text'] as const).flatMap((variant) =>
      [false, true].map((small) => (
        <>
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
        </>
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
    <AnchorButtonComp {...args}>External link</AnchorButtonComp>
    <AnchorButtonComp {...args} variant="outlined">
      External link
    </AnchorButtonComp>
    <AnchorButtonComp {...args} variant="text">
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
