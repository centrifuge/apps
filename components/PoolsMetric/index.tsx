import { FunctionComponent, default as React } from 'react';
import { Box, Text } from 'grommet';

interface MetricProps {
  label: string;
}

const PoolsMetric: FunctionComponent<MetricProps> = ({ label, children }) => {
  return <Box
    background="white"
    elevation="small"
    gap="xsmall"
    pad={{ left: 'large', right: 'large', top: 'small', bottom: 'small' }}
    margin={{ top: 'large' }}
  >
    <Text textAlign="center" truncate={true} weight="bold" style={{ fontSize: '1.7em', lineHeight: '40px', textOverflow: 'clip' }}>
      {children}</Text>
    <Text textAlign="center">{label}</Text>
  </Box>;
};

export default PoolsMetric;
