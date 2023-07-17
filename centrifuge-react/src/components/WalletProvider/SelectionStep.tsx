import { Box, Flex, IconCheck, IconInfoFilled, Shelf, Stack, Text, Tooltip } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { Network } from './types'
import { useGetNetworkName } from './utils'

type SelectionStepProps = {
  step: number
  title: string
  expanded?: boolean
  children?: React.ReactNode
  tooltip?: React.ReactNode
  titleElement?: React.ReactNode
  rightElement?: React.ReactNode
}

const Marker = styled(Flex)<{ $done: boolean }>`
  border-radius: 50%;
  background-color: ${({ theme, $done }) => ($done ? theme.colors.accentPrimary : theme.colors.textPrimary)};
`

export function SelectionStep({
  step,
  title,
  titleElement,
  expanded = true,
  children,
  tooltip,
  rightElement,
}: SelectionStepProps) {
  return (
    <Stack>
      <Shelf justifyContent="space-between">
        <Shelf gap={2}>
          <Marker width="iconMedium" height="iconMedium" $done={!expanded} justifyContent="center" alignItems="center">
            {expanded ? (
              <Text variant="interactive1" color="textInverted" textAlign="center">
                {step}
              </Text>
            ) : (
              <IconCheck size="iconSmall" color="textInverted" />
            )}
          </Marker>
          <Stack bleedY={2} gap="4px">
            <Text as="h3" variant={titleElement && !expanded ? 'label2' : 'heading4'} color="textPrimary">
              {title}
              {tooltip}
            </Text>
            {!expanded && titleElement}
          </Stack>
        </Shelf>
        <Box bleedY={2}>{rightElement}</Box>
      </Shelf>

      {expanded && children}
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
