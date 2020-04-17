import * as React from 'react';
import { Box, FormField, Button, Text } from 'grommet';
import NumberInput from '../../../components/NumberInput';
import { Investor, Tranche, redeem } from '../../../services/tinlake/actions';
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions';
import { baseToDisplay, displayToBase } from 'tinlake';
import { loadInvestor } from '../../../ducks/investments';
import { loadAnalyticsData } from '../../../ducks/analytics';
import { connect } from 'react-redux';
import { authTinlake } from '../../../services/tinlake';
import BN from 'bn.js';

interface Props {
  investor: Investor;
  tinlake: any;
  loadInvestor?: (tinlake: any, address: string, refresh?: boolean) => Promise<void>;
  loadAnalyticsData?: (tinlake: any) => Promise<void>;
  transactionSubmitted?: (loadingMessage: string) => Promise<void>;
  responseReceived?: (successMessage: string | null, errorMessage: string | null) => Promise<void>;
  tranche: Tranche;
}

interface State {
  redeemAmount: string;
}

class InvestorRedeem extends React.Component<Props, State> {

  componentWillMount() {
    this.setState({ redeemAmount: '0' });
  }

  redeem = async () => {
    const { tranche, transactionSubmitted, responseReceived, loadInvestor, loadAnalyticsData, investor, tinlake } = this.props;
    const { redeemAmount } = this.state;
    transactionSubmitted && transactionSubmitted("Redeem initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.");
    try {
      await authTinlake();
      const res = await redeem(tinlake, redeemAmount, tranche.type);
      if (res && res.errorMsg) {
        responseReceived && responseReceived(null, `Redeem failed. ${res.errorMsg}`);
        return;
      }
      responseReceived && responseReceived(`Redeem successful. Please check your wallet.`, null);
      loadInvestor && loadInvestor(tinlake, investor.address);
      loadAnalyticsData && loadAnalyticsData(tinlake);
    } catch (e) {
      responseReceived && responseReceived(null, `Redeem failed. ${e}`);
      console.log(e);
    }
  }

  render() {
    const { investor, tranche } = this.props;
    const { redeemAmount } = this.state;
    const trancheValues = investor[tranche.type];
    const maxRedeemAmount = trancheValues.maxRedeem || '0';
    const tokenBalance = trancheValues.tokenBalance || '0';
    const redeemLimitSet = maxRedeemAmount.toString() !== '0';
    const limitOverflow = (new BN(redeemAmount).cmp(new BN(maxRedeemAmount)) > 0);
    const availableTokensOverflow = (new BN(redeemAmount).cmp(new BN(tokenBalance)) > 0);
    const redeemEnabled = redeemLimitSet && !limitOverflow && !availableTokensOverflow;

    return <Box basis={'1/4'} gap="medium" margin={{ right: "large" }}>
      <Box gap="medium">
        <FormField label="Redeem token">
          <NumberInput value={baseToDisplay(redeemAmount, 18)} suffix={` ${tranche.token}`} precision={18}
            onValueChange={({ value }) =>
              this.setState({ redeemAmount: displayToBase(value, 18) })}
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={this.redeem} primary label="Redeem" disabled = {!redeemEnabled}/>

        {limitOverflow && !availableTokensOverflow  &&
          <Box margin={{top: "small"}}>
            Max redeem amount exceeded.   <br /> 
            Amount has to be lower then <br />
            <Text weight="bold">
              {`${baseToDisplay(maxRedeemAmount, 18)}`}
            </Text>
          </Box>
        }

        {availableTokensOverflow  &&
          <Box margin={{top: "small"}}>
            Available token amount exceeded.   <br /> 
            Amount has to be lower then <br />
            <Text weight="bold">
              {`${baseToDisplay(tokenBalance, 18)}`}
            </Text>
          </Box>
        }

      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadInvestor, loadAnalyticsData, transactionSubmitted, responseReceived })(InvestorRedeem);