import * as React from 'react';
import LoanList from '../../components/LoanList';
import WithTinlake from '../../components/WithTinlake';
import { AxisTheme } from '@centrifuge/axis-theme';
import { Box, Heading } from 'grommet';

class LoanListPage extends React.Component {
  render() {
    return <AxisTheme full={true}><Box pad="large">
      <Box justify="between" direction="row" align="center">
        <Heading level="3">Loans</Heading>
      </Box>

      <WithTinlake render={tinlake => <LoanList tinlake={tinlake} mode="borrower" />} />
    </Box></AxisTheme>;
  }
}

export default LoanListPage;
