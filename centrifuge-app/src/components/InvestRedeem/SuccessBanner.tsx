import { Box, IconCheckInCircle, Shelf, Stack, Text } from '@centrifuge/fabric'

export function SuccessBanner({ title, body }: { title: string; body?: React.ReactNode }) {
  return (
    <Stack gap={1}>
      <Shelf gap={1} color="statusOk">
        <IconCheckInCircle size="iconSmall" />
        <Text variant="body2" fontWeight={600} color="inherit">
          {title}
        </Text>
      </Shelf>
      {body && (
        <Box p={2} backgroundColor="secondarySelectedBackground" borderRadius="card">
          <Text variant="body3">{body}</Text>
        </Box>
      )}
    </Stack>
  )
}
