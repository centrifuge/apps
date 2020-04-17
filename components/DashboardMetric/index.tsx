import { FunctionComponent } from 'react';
import { Text, Box } from 'grommet';

interface Props {
  label: string;
}

const DashboardMetric: FunctionComponent<Props> = ({ label, children }) => {
  return <Box
    pad="small"
    background="white"
    elevation="small"
    gap="xsmall"
    margin="small"
  >
    <Text textAlign="center" truncate={true} weight="bold" style={{ fontSize: '1.2em', lineHeight: '40px', textOverflow: 'clip' }}>
      {children}</Text>
    <Text textAlign="center">{label}</Text>
  </Box>;
};

export default DashboardMetric;
