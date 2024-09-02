import { Box, InlineFeedback, Text } from '@centrifuge/fabric'

type Props = {
  children: React.ReactNode
  type: 'default' | 'critical' | 'warning'
  condition: boolean
}

const styles: Record<Props['type'], { bg: string; color: string }> = {
  default: {
    bg: 'statusDefaultBg',
    color: 'statusDefault',
  },
  critical: {
    bg: 'statusCriticalBg',
    color: 'statusCritical',
  },
  warning: {
    bg: 'statusWarningBg',
    color: 'statusWarning',
  },
}

export function ErrorMessage({ children, condition, type }: Props) {
  return condition ? (
    <Box bg={styles[type].bg} p={1}>
      <InlineFeedback status={type}>
        <Text color={styles[type].color}>{children}</Text>
      </InlineFeedback>
    </Box>
  ) : null
}
