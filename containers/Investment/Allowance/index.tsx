import * as React from 'react';
import { Box, FormField, Button, Heading } from 'grommet';
import NumberInput from '../../../components/NumberInput';
import { Investor, TrancheType, setAllowance } from '../../../services/tinlake/actions';
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
  trancheType: TrancheType;
}

interface State {
  supplyAmount: string;
  redeemAmount: string;
}

class InvestorAllowance extends React.Component<Props, State> {

  componentWillMount() {
    this.setState({ supplyAmount: '0', redeemAmount: '0' });
  }

  setAllowance = async () => {
    this.props.transactionSubmitted && this.props.transactionSubmitted("Allowance initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.");
    try {
      await authTinlake();
      const { supplyAmount, redeemAmount } = this.state;
      const { investor, trancheType, tinlake } = this.props;
      const res = await setAllowance(tinlake, investor.address, supplyAmount, redeemAmount, trancheType);
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
    return <Box>
      <Box gap="medium" align="start" margin={{ bottom: "medium" }} >
        <Heading level="4" margin="none"> Set allowance </Heading>
      </Box>
      <Box gap="medium" direction="row" margin={{ right: "large" }}>
        <Box basis={'1/3'}>
          <FormField label="Max investment amount">
            <NumberInput value={baseToDisplay(supplyAmount, 18)} suffix=" DAI" precision={18}
              onValueChange={({ value }) =>
                this.setState({ supplyAmount: displayToBase(value, 18) })}
            />
          </FormField>
        </Box>
        <Box basis={'1/3'}>
          <FormField label="Max redeem amount">
            <NumberInput value={baseToDisplay(redeemAmount, 18)} suffix=" TIN" precision={18}
              onValueChange={({ value }) =>
                this.setState({ redeemAmount: displayToBase(value, 18) })}
            />
          </FormField>
        </Box>
        <Box >
          <Button onClick={this.setAllowance} primary label="Set Allowance" />
        </Box>
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadInvestor, transactionSubmitted, responseReceived })(InvestorAllowance);