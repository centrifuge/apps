import * as React from 'react';
import { Box, FormField, Button, Text } from 'grommet';
import NumberInput from '../../../components/NumberInput';
import { TrancheType, supply } from '../../../services/tinlake/actions';
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions';
import { baseToDisplay, displayToBase, Investor } from 'tinlake';
import { loadInvestor } from '../../../ducks/investments';
import { loadPool } from '../../../ducks/pool';
import { connect } from 'react-redux';
import { authTinlake } from '../../../services/tinlake';
import BN from 'bn.js';

interface Props {
  investor: Investor;
  tinlake: any;
  loadInvestor?: (tinlake: any, address: string, refresh?: boolean) => Promise<void>;
  loadPool?: (tinlake: any) => Promise<void>;
  transactionSubmitted?: (loadingMessage: string) => Promise<void>;
  responseReceived?: (successMessage: string | null, errorMessage: string | null) => Promise<void>;
  trancheType: TrancheType;
}

interface State {
  supplyAmount: string;
}

class InvestorSupply extends React.Component<Props, State> {
  state: State = {
    supplyAmount: '0'
  };

  supply = async () => {
    const { transactionSubmitted, responseReceived, trancheType, tinlake, investor, loadInvestor, loadPool } = this.props;
    const { supplyAmount } = this.state;
    transactionSubmitted && transactionSubmitted('Investment initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.');
    try {
      await authTinlake();
      const res = await supply(tinlake, supplyAmount, trancheType);
      if (res && res.errorMsg) {
        responseReceived && responseReceived(null, `Investment failed. ${res.errorMsg}`);
        return;
      }
      if (trancheType === 'junior') {
        responseReceived && responseReceived('Investment successful. Please check your wallet for TIN tokens.', null);
      } else if (trancheType === 'senior') {
        responseReceived && responseReceived('Investment successful. Please check your wallet for DROP tokens.', null);
      }
      loadInvestor && loadInvestor(tinlake, investor.address);
      loadPool && loadPool(tinlake);
    } catch (e) {
      responseReceived && responseReceived(null, `Investment failed. ${e}`);
      console.log(e);
    }
  }

  render() {
    const { investor, trancheType } = this.props;
    const { supplyAmount } = this.state;
    const trancheValues = investor[trancheType];
    const maxSupplyAmount =  trancheValues.maxSupply || '0';
    const maxSupplyOverflow =  (new BN(supplyAmount).cmp(new BN(maxSupplyAmount)) > 0);
    const canSupply = maxSupplyAmount.toString() !== '0' && !maxSupplyOverflow;
    return <Box basis={'1/4'} gap="medium" margin={{ right: 'large' }}>
      <Box gap="medium">
        <FormField label="Investment amount">
          <NumberInput value={baseToDisplay(supplyAmount, 18)} suffix=" DAI" precision={18}
            onValueChange={({ value }) =>
              this.setState({ supplyAmount: displayToBase(value, 18) })}
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={this.supply} primary label="Invest" disabled={!canSupply }  />
        {maxSupplyOverflow &&
         <Box margin={{ top: 'small' }}>
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

export default connect(state => state, { loadInvestor, loadPool, transactionSubmitted, responseReceived })(InvestorSupply);
