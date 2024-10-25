import { Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'

type Props = {
  data?: {
    label: React.ReactNode
    value: React.ReactNode
  }[]
  children?: React.ReactNode
  loan?: Loan | TinlakeLoan
}

export function AssetSummary({ data, children, loan }: Props) {
  const theme = useTheme()
  return (
    <Stack
      bg={theme.colors.backgroundSecondary}
      border={`1px solid ${theme.colors.borderSecondary}`}
      borderRadius={10}
      padding={2}
      marginLeft={[2, 2, 2, 2, 5]}
      marginRight={[2, 2, 2, 2, 5]}
    >
      <Shelf gap="6">
        {data?.map(({ label, value }, index) => (
          <Stack key={`${value}-${label}-${index}`}>
            <Text variant="body2" styke={{ margin: 0, padding: 0 }}>
              {label}
            </Text>
            <Text variant="heading">{value}</Text>
          </Stack>
        ))}
        {children}
      </Shelf>
    </Stack>
  )
}
