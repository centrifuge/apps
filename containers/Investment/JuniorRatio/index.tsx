import * as React from 'react';
import BN from 'bn.js';
import { Box, FormField, Button, Heading } from 'grommet';
import { baseToDisplay, displayToBase } from 'tinlake';
import NumberInput from '../../../components/NumberInput';
import { setMinJuniorRatio} from '../../../services/tinlake/actions';
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions';
import { loadAnalyticsData } from '../../../ducks/analytics';
import { connect } from 'react-redux';
import { Decimal } from 'decimal.js-light';

Decimal.set({
    precision: 27,
    toExpNeg: -7,
    toExpPos: 30,
  });
  
interface Props {
    minJuniorRatio: BN;
    tinlake: any;
    loadAnalyticsData?: (tinlake: any) => Promise<void>;
    transactionSubmitted?: (loadingMessage: string) => Promise<void>;
    responseReceived?: (successMessage: string | null, errorMessage: string | null) => Promise<void>;
}

interface State {
    minJuniorRatio: string;
}

class JuniorRatio extends React.Component<Props, State> {

    componentWillMount() {
        const { minJuniorRatio } = this.props;
        // multiply with 100 to show the percent value
        const normalizedJuniorRatio = minJuniorRatio && (new Decimal(minJuniorRatio.toString())).mul(100);
        this.setState({ minJuniorRatio: (normalizedJuniorRatio && normalizedJuniorRatio.toString() || '0') });
    }

    setMinJuniorRatio = async () => {
        const { minJuniorRatio } = this.state;
        const normalizedRatio = new Decimal(minJuniorRatio).div(100).toString();
        const { tinlake, loadAnalyticsData, responseReceived, transactionSubmitted } = this.props;
        transactionSubmitted && transactionSubmitted(`Setting mininum junior ratio initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.`);
        try {
          const res = await setMinJuniorRatio(tinlake, normalizedRatio);
          if (res && res.errorMsg) {
            responseReceived && responseReceived(null, `Setting minimun junior ratio failed. ${res.errorMsg}`);
            return;
          } 
          responseReceived && responseReceived(`Minimum junior ratio set successfully.`, null);
          loadAnalyticsData && loadAnalyticsData(tinlake);
        } catch(e) {
          responseReceived && responseReceived(null, `Changing minimum junior ratio failed. ${e}`);
          console.log(e);
        }
    }
    render() {
        const { minJuniorRatio } = this.state;
        return <Box pad={{ horizontal: 'medium' }}>
            <Box direction="row" margin={{ top: 'medium' }}>
                <Heading level="4">Set minimum junior ratio</Heading>
            </Box>
            <Box direction="row" gap="medium" >
                <Box basis={'1/3'}>
                    <FormField label="Min junior ratio">
                        <NumberInput value={baseToDisplay(minJuniorRatio, 27)} precision={2}
                            onValueChange={({ value }) =>
                                this.setState({ minJuniorRatio: displayToBase(value, 27) })}
                        />
                    </FormField>
                </Box>
                <Box align="start">
                    <Button primary label="Set min junior ratio" onClick={this.setMinJuniorRatio} />
                </Box>
            </Box>
        </Box>;
    }
}

export default connect(state => state, { loadAnalyticsData, transactionSubmitted, responseReceived })(JuniorRatio);

