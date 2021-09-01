import { Text } from 'grommet'
import { FunctionComponent } from 'react'
import { Card } from '../Card'
import { Stack } from '../Layout'

interface Props {
  label: string
}

const DashboardMetric: FunctionComponent<Props> = ({ label, children }) => {
  return (
    <Stack as={Card} p="medium" gap="xsmall">
      <Text
        textAlign="center"
        truncate={true}
        style={{ fontSize: '1.3em', lineHeight: '40px', textOverflow: 'clip', borderBottom: '1px solid #EEEEEE' }}
      >
        {children}
      </Text>
      <Text textAlign="center">{label}</Text>
    </Stack>
  )
}

export default DashboardMetric
