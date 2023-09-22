import { Box, InlineFeedback, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'

export function UserFeedback({ reportType }: { reportType: string }) {
  return (
    <Shelf px={2} mt={2} justifyContent="center">
      <Box px={2} py={1} borderRadius="input" backgroundColor="secondarySelectedBackground">
        <InlineFeedback status="info">
          No{' '}
          <Text as="strong" fontWeight={600}>
            {reportType}
          </Text>{' '}
          data available for this pool. Try to select another report or date range.
        </InlineFeedback>
      </Box>
    </Shelf>
  )
}
