import { FunctionComponent } from 'react';
import { Text, Box } from 'grommet';

interface Props {
  label: string;
}

const DashboardMetric: FunctionComponent<Props> = ({ label, children }) => {
  return <Box
    pad="medium"
    background="white"
    elevation="medium"
    gap="xsmall"
    margin="medium"
  >
    <Text textAlign="center" weight="bold" style={{ fontSize: 28, lineHeight: '40px' }}>
      {children}</Text>
    <Text textAlign="center">{label}</Text>
  </Box>;
};

export default DashboardMetric;
