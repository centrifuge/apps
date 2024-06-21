import { Box, Grid, Text } from '@centrifuge/fabric'

type Props = {
  metrics: { label: string; value: string }[]
}

export function MetricsTable({ metrics }: Props) {
  return (
    <Box borderStyle="solid" borderWidth="1px" borderColor="borderPrimary">
      {metrics.map(({ label, value }, index) => (
        <Grid
          borderBottomStyle={index === metrics.length - 1 ? 'none' : 'solid'}
          borderBottomWidth={index === metrics.length - 1 ? '0' : '1px'}
          borderBottomColor={index === metrics.length - 1 ? 'none' : 'borderPrimary'}
          height={32}
          key={index}
          px={1}
          gridTemplateColumns="1fr 1fr"
          width="100%"
          alignItems="center"
          gap={2}
        >
          <Text variant="body3" textOverflow="ellipsis" whiteSpace="nowrap">
            {label}
          </Text>
          <Text variant="body3" textOverflow="ellipsis" whiteSpace="nowrap">
            {value}
          </Text>
        </Grid>
      ))}
    </Box>
  )
}
