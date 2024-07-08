import { AnchorTextLink } from '@centrifuge/centrifuge-app/src/components/TextLink'
import { Box, Grid, Text } from '@centrifuge/fabric'

type Metric = {
  label: string
  value: string
}

type Props = {
  metrics: Metric[]
}

export function MetricsTable({ metrics }: Props) {
  return (
    <Box borderStyle="solid" borderWidth="1px" borderColor="borderPrimary">
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

        const combinedStyle: React.CSSProperties = { ...defaultStyle, ...multiRowStyle }

        return (
          <Grid
            borderBottomStyle={index === metrics.length - 1 ? 'none' : 'solid'}
            borderBottomWidth={index === metrics.length - 1 ? '0' : '1px'}
            borderBottomColor={index === metrics.length - 1 ? 'none' : 'borderPrimary'}
            key={index}
            px={1}
            gridTemplateColumns="1fr 1fr"
            width="100%"
            alignItems="center"
            gap={2}
            height={multirow ? 'auto' : 32}
          >
            <Text variant="body3" textOverflow="ellipsis" whiteSpace="nowrap">
              {label}
            </Text>
            <Text variant="body3" style={combinedStyle}>
              {asLink ? <AnchorTextLink href={value}>{value}</AnchorTextLink> : value}
            </Text>
          </Grid>
        )
      })}
    </Box>
  )
}
