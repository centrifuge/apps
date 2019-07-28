import * as React from 'react';
import { InternalSingleLoan } from '../../ducks/loans';
import { Box, FormField, TextInput } from 'grommet';
import { baseToDisplay, feeToInterestRate } from 'tinlake';
import NumberInput from '../NumberInput';

interface Props {
  loan: InternalSingleLoan;
}

const none = <TextInput value="-" disabled />;

class LoanData extends React.Component<Props> {
  render() {
    const { loan: { status, debt, fee, principal, appraisal } } = this.props;

    return <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
      <Box basis={'1/4'} gap="medium"><FormField label="Debt">
        {status === 'Whitelisted' ? none :
          <NumberInput value={baseToDisplay(debt, 18)} suffix=" DAI" precision={18} disabled />}
      </FormField></Box>
      <Box basis={'1/4'} gap="medium"><FormField label="Interest Rate">
        {status === 'Repaid' ? none :
          <NumberInput value={feeToInterestRate(fee)} suffix="%" disabled />}
      </FormField></Box>
      <Box basis={'1/4'} gap="medium"><FormField label="Principal Amount">
        {status === 'Whitelisted' ?
          <NumberInput value={baseToDisplay(principal, 18)} suffix=" DAI"
            disabled precision={18} /> :
            none}
      </FormField></Box>
      <Box basis={'1/4'} gap="medium"><FormField label="Appraisal Amount">
        <NumberInput value={baseToDisplay(appraisal, 18)} suffix=" DAI" disabled precision={18} />
      </FormField></Box>
  </Box>;
  }
}

export default LoanData;
