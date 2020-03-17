import * as React from 'react';
import { Box, FormField, Button, Text } from 'grommet';
import NumberInput from '../../../components/NumberInput';
import { Investor, supplyJunior } from '../../../services/tinlake/actions';
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
  supplyAmount: string;
}

class InvestorSupply extends React.Component<Props, State> {

  componentWillMount() {
    const { investor } = this.props;
    this.setState({ supplyAmount: investor && investor.maxSupplyJunior || '0' });
  }

  supplyJunior = async () => {
    this.props.transactionSubmitted && this.props.transactionSubmitted("Investment initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.");
    try {
      await authTinlake();
      const { supplyAmount } = this.state;
      const { investor, tinlake } = this.props;
     
      const res = await supplyJunior(tinlake, supplyAmount);
      if (res && res.errorMsg) {
        this.props.responseReceived && this.props.responseReceived(null, `Investment failed. ${res.errorMsg}`);
        return;
      }
      this.props.responseReceived && this.props.responseReceived(`Investment successful. Please check your wallet for TIN tokens.`, null);
      this.props.loadInvestor && this.props.loadInvestor(tinlake, investor.address);
    } catch (e) {
      this.props.responseReceived && this.props.responseReceived(null, `Investment failed. ${e}`);
      console.log(e);
    }
  }

  render() {
    const { supplyAmount } = this.state;
    const { investor } = this.props;
    const maxSupplyAmount =  (investor && investor.maxSupplyJunior || '0')
    const maxSupplyOverflow =  (new BN(supplyAmount).cmp(new BN(maxSupplyAmount)) > 0);
    const canSupply = maxSupplyAmount.toString() != '0' && !maxSupplyOverflow;

    return <Box basis={'1/4'} gap="medium" margin={{ right: "large" }}>
      <Box gap="medium">
        <FormField label="Investment amount">
          <NumberInput value={baseToDisplay(supplyAmount, 18)} suffix=" DAI" precision={18}
            onValueChange={({ value }) =>
              this.setState({ supplyAmount: displayToBase(value) })}
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={this.supplyJunior} primary label="Invest" disabled={!canSupply }  />
        {maxSupplyOverflow &&
         <Box margin={{top: "small"}}>
             Max investment amount exceeded. <br /> 
             Amount has to be lower then <br />
             <Text weight="bold">
              {`${maxSupplyAmount.toString()}`}
             </Text>
           </Box>
        }
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadInvestor, transactionSubmitted, responseReceived })(InvestorSupply);