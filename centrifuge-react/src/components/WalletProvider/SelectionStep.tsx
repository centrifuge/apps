import {
  Box,
  IconCheckInCircle,
  IconChevronDown,
  IconChevronUp,
  IconCrosschair,
  IconInfoFilled,
  Shelf,
  Stack,
  Text,
  Tooltip,
} from '@centrifuge/fabric'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { Network } from './types'
import { useGetNetworkName } from './utils'

type SelectionStepProps = {
  title: string
  children?: React.ReactNode
  tooltip?: React.ReactNode
  done: boolean
  expanded: boolean
  toggleExpanded: () => void
  disabled?: boolean
}

export function SelectionStep({
  title,
  children,
  tooltip,
  done,
  toggleExpanded,
  expanded,
  disabled = false,
}: SelectionStepProps) {
  const theme = useTheme()

  const toggle = () => {
    if (!disabled) {
      toggleExpanded()
    }
  }

  return (
    <Stack
      border={`1px solid ${theme.colors.borderPrimary}`}
      padding={2}
      borderRadius={10}
      minHeight={68}
      justifyContent="center"
      pt={expanded ? 4 : 2}
    >
      <Shelf justifyContent="space-between" onClick={() => toggle()} style={{ cursor: 'pointer' }}>
        <Shelf gap={2}>
          <Box bleedY={2} display="flex" justifyContent="space-between" alignItems="center">
            {done ? <IconCheckInCircle color="statusOk" /> : <IconCrosschair color="statusOkBg" />}
            <Text as="h3" variant="heading3" style={{ marginLeft: 8, fontWeight: 700 }}>
              {title}
              {tooltip}
            </Text>
          </Box>
        </Shelf>
        <Box bleedY={2}>{expanded ? <IconChevronUp /> : <IconChevronDown />}</Box>
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
