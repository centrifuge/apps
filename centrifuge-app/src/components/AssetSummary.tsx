import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'

type Props = {
  data?: {
    label: React.ReactNode
    value: React.ReactNode
    heading: boolean
    children?: React.ReactNode
  }[]
  children?: React.ReactNode
}

export function AssetSummary({ data, children }: Props) {
  const theme = useTheme()
  return (
    <Stack
      bg={theme.colors.backgroundSecondary}
      border={`1px solid ${theme.colors.borderSecondary}`}
      borderRadius={10}
      padding={2}
      mx={[2, 2, 2, 2, 5]}
    >
      <Shelf gap={2}>
        {data?.map(({ label, value, heading, children }, index) => (
          <Stack key={`${value}-${label}-${index}`}>
            <Text variant={heading ? 'body2' : 'body3'} color="textSecondary" style={{ margin: 0, padding: 0 }}>
              {label}
            </Text>
            <Box display="flex" alignItems="center">
              <Text variant={heading ? 'heading' : 'heading1'} style={{ marginRight: 8 }}>
                {value}
              </Text>
              {children && children}
            </Box>
          </Stack>
        ))}
        {children}
      </Shelf>
    </Stack>
  )
}
