import { AnchorTextLink } from '@centrifuge/centrifuge-app/src/components/TextLink'
import { Box, Grid, Text } from '@centrifuge/fabric'

type Metric = {
  label: React.ReactNode
  value: string | undefined
}

type Props = {
  metrics: Metric[]
}

export function MetricsTable({ metrics }: Props) {
  return (
    <Box>
      {metrics.map(({ label, value }, index) => {
        const multirow = value && value.length > 20
        const asLink = value && /^(https?:\/\/[^\s]+)$/.test(value)

        const defaultStyle: React.CSSProperties = {
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        }

        const multiRowStyle: React.CSSProperties = multirow
          ? {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflow: 'visible',
              lineHeight: '1.2',
              padding: '4px 0',
            }
          : {}

        const combinedStyle: React.CSSProperties = { ...defaultStyle, ...multiRowStyle, textAlign: 'right' }

        return (
          <Grid
            key={index}
            gridTemplateColumns="1fr 1fr"
            width="100%"
            alignItems="center"
            gap={2}
            height={multirow ? 'auto' : 32}
          >
            <Text color="textSecondary" variant="body2" textOverflow="ellipsis" whiteSpace="nowrap">
              {label}
            </Text>
            <Text variant="heading4" style={combinedStyle}>
              {asLink ? <AnchorTextLink href={value}>{value}</AnchorTextLink> : value}
            </Text>
          </Grid>
        )
      })}
    </Box>
  )
}
