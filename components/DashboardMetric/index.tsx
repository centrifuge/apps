import { FunctionComponent } from 'react';
import { Text, Box } from 'grommet';

interface Props {
  label: string;
}

const DashboardMetric: FunctionComponent<Props> = ({ label, children }) => {
  return <Box
    pad="medium"
    background="white"
    elevation="small"
    gap="xsmall"
    margin="small"
  >
<Text textAlign="center" truncate={true} style={{ fontSize: '1.3em', lineHeight: '40px', textOverflow: 'clip', borderBottom: '1px solid #EEEEEE' }}>
      {children}</Text>
    <Text textAlign="center">{label}</Text>
  </Box>;
};

export default DashboardMetric;
