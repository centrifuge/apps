import { Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import LoanLabel from './LoanLabel'

type Props = {
  data?: {
    label: React.ReactNode
    value: React.ReactNode
  }[]
  children?: React.ReactNode
  loan: Loan | TinlakeLoan
}

export const AssetSummary: React.FC<Props> = ({ data, children, loan }) => {
  const theme = useTheme()
  return (
    <Stack bg={theme.colors.backgroundSecondary} pl={3}>
      <Box paddingTop={3}>
        <Shelf gap="2">
          <Text variant="heading2">Details</Text>
          <LoanLabel loan={loan} />
        </Shelf>
      </Box>
      <Shelf
        gap="6"
        py="3"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderPrimary}`,
        }}
      >
        {data?.map(({ label, value }, index) => (
          <Stack gap="4px" key={`${value}-${label}-${index}`}>
            <Text variant="body3" style={{ fontWeight: 500 }}>
              {label}
            </Text>
            <Text variant="body2">{value}</Text>
          </Stack>
        ))}
        {children}
      </Shelf>
    </Stack>
  )
}
