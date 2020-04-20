import * as React from 'react';
import BN from 'bn.js';
import { Box, FormField, Button, Heading } from 'grommet';
import { baseToDisplay, displayToBase } from 'tinlake';
import NumberInput from '../../../components/NumberInput';
import { setMinJuniorRatio} from '../../../services/tinlake/actions';
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions';
import { loadAnalyticsData } from '../../../ducks/analytics';
import { connect } from 'react-redux';

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
        this.setState({ minJuniorRatio: (minJuniorRatio && minJuniorRatio.toString() || '0') });
    }

    setMinJuniorRatio = async () => {
        const { minJuniorRatio } = this.state;
        const { tinlake, loadAnalyticsData, responseReceived, transactionSubmitted } = this.props;
        transactionSubmitted && transactionSubmitted(`Setting mininum junior ratio initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.`);
        try {
          const res = await setMinJuniorRatio(tinlake, minJuniorRatio);
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
                        <NumberInput value={baseToDisplay(minJuniorRatio, 18)} precision={2}
                            onValueChange={({ value }) =>
                                this.setState({ minJuniorRatio: displayToBase(value, 18) })}
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

