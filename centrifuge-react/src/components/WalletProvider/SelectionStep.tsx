import { Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

type SelectionStepProps = {
  step: number
  title: string
  disabled?: boolean
  children?: React.ReactNode
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

export function SelectionStep({ step, title, disabled = false, children }: SelectionStepProps) {
  return (
    <Stack>
      <Text variant="heading4" color={disabled ? 'textDisabled' : 'textPrimary'}>
        <Marker variant="interactive1" color="textInverted" textAlign="center" lineHeight="1.6em" disabled={disabled}>
          {step}
        </Marker>
        {title}
      </Text>
      <Grid minColumnWidth={120} mt={2} pl={4} gap={1}>
        {children}
      </Grid>
    </Stack>
  )
}
