import * as React from 'react';
import { Box, FormField, Button } from 'grommet';
import NumberInput from '../../../components/NumberInput';
import { Investor, setAllowanceJunior } from '../../../services/tinlake/actions';
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions';
import { baseToDisplay, displayToBase } from 'tinlake';
import { loadInvestor } from '../../../ducks/investments';
import { connect } from 'react-redux';
import { authTinlake } from '../../../services/tinlake';

interface Props {
  investor: Investor;
  tinlake: any;
  loadInvestor?: (tinlake: any, address: string, refresh?: boolean) => Promise<void>;
  transactionSubmitted?: (loadingMessage: string) => Promise<void>;
  responseReceived?: (successMessage: string | null, errorMessage: string | null) => Promise<void>;
}

interface State {
  supplyAmount: string;
  redeemAmount: string;
}

class InvestorAllowance extends React.Component<Props, State> {

  componentWillMount() {
    const { investor } = this.props;
    this.setState({ supplyAmount: (investor && investor.maxSupplyJunior || '0'), redeemAmount: (investor.maxRedeemJunior || '0') });
  }

  setJunior = async () => {
    this.props.transactionSubmitted && this.props.transactionSubmitted("Allowance initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.");
    try {
      await authTinlake();
      const { supplyAmount, redeemAmount } = this.state;
      const { investor, tinlake } = this.props;
      const res = await setAllowanceJunior(tinlake, investor.address, supplyAmount, redeemAmount);
      if (res && res.errorMsg) {
        this.props.responseReceived && this.props.responseReceived(null, `Allowance failed. ${res.errorMsg}`);
        return;
      }
      this.props.responseReceived && this.props.responseReceived(`Allowance successful.`, null);
      this.props.loadInvestor && this.props.loadInvestor(tinlake, investor.address);
    } catch (e) {
      this.props.responseReceived && this.props.responseReceived(null, `Allowance failed. ${e}`);
      console.log(e);
    }
}

  render() {
    const { supplyAmount, redeemAmount } = this.state;
    return <Box gap="medium" direction="row" margin={{ right: "large" }}>
       <Box basis={'1/3'}>
          <FormField label="Junior maximum investment amount">
            <NumberInput value={baseToDisplay(supplyAmount, 18)} suffix=" DAI" precision={18}
              onValueChange={({ value }) =>
                this.setState({ supplyAmount: displayToBase(value) })}
            />
          </FormField>
        </Box>
        <Box basis={'1/3'}>
          <FormField label="Junior maximum redeem amount">
            <NumberInput value={baseToDisplay(redeemAmount, 18)} suffix=" TIN" precision={18}
              onValueChange={({ value }) =>
                this.setState({ redeemAmount: displayToBase(value) })}
            />
          </FormField>
        </Box>
        <Box >
          <Button onClick={this.setJunior} primary label="Set junior limits" />
        </Box>
    </Box>;
  }
}

export default connect(state => state, { loadInvestor, transactionSubmitted, responseReceived })(InvestorAllowance);