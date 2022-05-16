import { Divider, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

type Item = {
  label: React.ReactNode
  value: React.ReactNode
}

type Props = {
  items: (Item | undefined)[]
}

export const LabelValueList: React.FC<Props> = ({ items }) => {
  return (
    <Stack as="dl" gap={2} pt={2} margin={0}>
      {items
        .filter((item) => item !== undefined)
        .map((item, i) => (
          <React.Fragment key={i}>
            <Shelf justifyContent="space-between" alignItems="baseline">
              <Text as="dt" variant="body2">
                {item!.label}
              </Text>
              <Text as="dd" variant="body2">
                {item!.value}
              </Text>
            </Shelf>
            <Divider />
          </React.Fragment>
        ))}
    </Stack>
  )
}
