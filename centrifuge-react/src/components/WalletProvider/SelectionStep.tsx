import { useGetNetworkName } from '@centrifuge/centrifuge-react'
import { Grid, IconInfoFilled, Stack, Text, Tooltip } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { Network } from './types'

type SelectionStepProps = {
  step: number
  title: string
  disabled?: boolean
  children?: React.ReactNode
  tooltip?: React.ReactNode
}

const Marker = styled(Text)<{ disabled: boolean }>`
  display: inline-block;
  vertical-align: baseline;
  width: 1.6em;
  height: 1.6em;
  margin-right: 0.7em;
  border-radius: 50%;
  background-color: ${({ theme, disabled }) => (disabled ? theme.colors.textDisabled : theme.colors.textPrimary)};
`

export function SelectionStep({ step, title, disabled = false, children, tooltip }: SelectionStepProps) {
  return (
    <Stack>
      <Text as="h3" variant="heading4" color={disabled ? 'textDisabled' : 'textPrimary'}>
        <Marker variant="interactive1" color="textInverted" textAlign="center" lineHeight="1.6em" disabled={disabled}>
          {step}
        </Marker>
        {title}
        {tooltip}
      </Text>
      <Grid minColumnWidth={120} mt={2} pl={4} gap={1}>
        {children}
      </Grid>
    </Stack>
  )
}

const StyledTooltip = styled(Tooltip)`
  margin-left: 0.4em;
  vertical-align: middle;
`

export function SelectionStepTooltip({ networks }: { networks: Network[] }) {
  // @ts-ignore
  const listFormatter = new Intl.ListFormat('en')
  const getNetworkName = useGetNetworkName()

  return (
    <StyledTooltip
      title="Network selection"
      body={`This pool only supports investing and redeeming from the ${listFormatter.format(
        networks.map(getNetworkName)
      )} ${networks.length > 1 ? 'networks' : 'network'}`}
    >
      <IconInfoFilled size="iconSmall" color="textSecondary" />
    </StyledTooltip>
  )
}
