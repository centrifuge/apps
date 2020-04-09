import { FunctionComponent } from 'react';
import { Text, Box } from 'grommet';

interface Props {
  label: string;
}

const DashboardMetric: FunctionComponent<Props> = ({ label, children }) => {
  return <Box
    pad="medium"
    background="light-1"
    elevation="medium"
    gap="xsmall"
  >
    <Text textAlign="center" weight="bold" style={{ fontSize: 28, lineHeight: '40px' }}>
      {children}</Text>
    <Text textAlign="center">{label}</Text>
  </Box>;
};

export default DashboardMetric;
