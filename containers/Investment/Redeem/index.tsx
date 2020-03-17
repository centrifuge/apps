import * as React from 'react';
import { Box, FormField, Button, Text } from 'grommet';
import NumberInput from '../../../components/NumberInput';
import { Investor, redeemJunior } from '../../../services/tinlake/actions';
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions';
import { baseToDisplay, displayToBase } from 'tinlake';
import { loadInvestor } from '../../../ducks/investments';
import { connect } from 'react-redux';
import { authTinlake } from '../../../services/tinlake';
import BN from 'bn.js';

interface Props {
  investor: Investor;
  tinlake: any;
  loadInvestor?: (tinlake: any, address: string, refresh?: boolean) => Promise<void>;
  transactionSubmitted?: (loadingMessage: string) => Promise<void>;
  responseReceived?: (successMessage: string | null, errorMessage: string | null) => Promise<void>;
}

interface State {
  redeemAmount: string;
}

class InvestorRedeem extends React.Component<Props, State> {

  componentWillMount() {
    const { investor } = this.props;
    const maxRedeemAmount = investor && investor.maxRedeemJunior || '0';
    const juniorTokenBalance = investor && investor.tokenBalanceJunior || '0';
    const redeemAmount = (new BN(maxRedeemAmount).cmp(new BN(juniorTokenBalance)) > 0) ? juniorTokenBalance : maxRedeemAmount;
    this.setState({ redeemAmount });
  }

  redeemJunior = async () => {
    this.props.transactionSubmitted && this.props.transactionSubmitted("Redeem initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.");
    try {
      await authTinlake();
      const { redeemAmount } = this.state;
      const { investor, tinlake } = this.props;
      const res = await redeemJunior(tinlake, redeemAmount);
      if (res && res.errorMsg) {
        this.props.responseReceived && this.props.responseReceived(null, `Redeem failed. ${res.errorMsg}`);
        return;
      }
      this.props.responseReceived && this.props.responseReceived(`Redeem successful. Please check your wallet.`, null);
      this.props.loadInvestor && this.props.loadInvestor(tinlake, investor.address);
    } catch (e) {
      this.props.responseReceived && this.props.responseReceived(null, `Redeem failed. ${e}`);
      console.log(e);
    }
  }

  render() {
    const { redeemAmount } = this.state;
    const { investor } = this.props;
    const maxRedeemAmount = investor && investor.maxRedeemJunior || '0';
    const juniorTokenBalance = investor && investor.tokenBalanceJunior || '0';
    const redeemLimitSet = maxRedeemAmount.toString() !== '0';
    const limitOverflow = (new BN(redeemAmount).cmp(new BN(maxRedeemAmount)) > 0);
    const availableTokensOverflow = (new BN(redeemAmount).cmp(new BN(juniorTokenBalance)) > 0);
    const redeemEnabled = redeemLimitSet && !limitOverflow && !availableTokensOverflow;

    return <Box basis={'1/4'} gap="medium" margin={{ right: "large" }}>
      <Box gap="medium">
        <FormField label="Redeem token">
          <NumberInput value={baseToDisplay(redeemAmount, 18)} suffix=" TIN" precision={18}
            onValueChange={({ value }) =>
              this.setState({ redeemAmount: displayToBase(value) })}
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={this.redeemJunior} primary label="Redeem" disabled = {!redeemEnabled}/>

        {limitOverflow && !availableTokensOverflow  &&
          <Box margin={{top: "small"}}>
            Max redeem amount exceeded.   <br /> 
            Amount has to be lower then <br />
            <Text weight="bold">
              {`${maxRedeemAmount.toString()}`}
            </Text>
          </Box>
        }

        {availableTokensOverflow  &&
          <Box margin={{top: "small"}}>
            Available token amount exceeded.   <br /> 
            Amount has to be lower then <br />
            <Text weight="bold">
              {`${juniorTokenBalance.toString()}`}
            </Text>
          </Box>
        }

      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadInvestor, transactionSubmitted, responseReceived })(InvestorRedeem);