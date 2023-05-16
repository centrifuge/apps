import { Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Tooltips, TooltipsProps } from '../Tooltips'

export type LegendProps = {
  data: {
    color: string
    tooltip?: TooltipsProps
    label?: string
    body?: string | number
  }[]
}

export function Legend({ data }: LegendProps) {
  return (
    <Shelf bg="backgroundPage" width="100%" gap="2">
      <Grid pl="5" pb="4" columns={6} gap="3" width="100%">
        {!!data &&
          !!data.length &&
          data.map(({ color, tooltip, label, body }, index) => (
            <Stack
              key={`${index}${color}`}
              pl="4px"
              borderLeftWidth="3px"
              borderLeftStyle="solid"
              borderLeftColor={color}
            >
              {!!tooltip && <Tooltips variant="secondary" {...tooltip} />}
              {!!label && (
                <Text textAlign="left" variant="label2" color="textSecondary">
                  {label}
                </Text>
              )}
              {!!body && <Text variant="body2">{body}</Text>}
            </Stack>
          ))}
      </Grid>
    </Shelf>
  )
}
