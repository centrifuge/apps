import * as React from 'react';
import Tinlake from 'tinlake';
import { Box, FormField, TextInput, Button, Heading, Text } from 'grommet';
import Alert from '../Alert';
import Link from 'next/link';
import SecondaryHeader from '../SecondaryHeader';
import { LinkPrevious } from 'grommet-icons';
import { NumberInput } from '@centrifuge/axis-number-input';
import { baseToDisplay } from '../../utils/baseToDisplay';
import { displayToBase } from '../../utils/displayToBase';
import { interestRateToFee } from '../../utils/interestRateToFee';
import { connect } from 'react-redux';
import { NFTState, getNFT } from '../../ducks/nft';
import NftData from '../NftData';

const SUCCESS_STATUS = '0x1';

interface Props {
  tinlake: Tinlake;
  tokenId: string;
  nft?: NFTState;
  getNFT?: (tinlake: Tinlake, tonkenId: string) => Promise<void>;
}

interface State {
  tokenId: string;
  principal: string;
  appraisal: string;
  interestRate: string;
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
}

class WhitelistNFT extends React.Component<Props, State> {
  state: State = {
    tokenId: '',
    principal: '100000000000000000000',
    appraisal: '300000000000000000000',
    interestRate: '5',
    is: null,
    errorMsg: '',
  };

  componentWillMount() {
    this.setState({ tokenId: this.props.tokenId || '' }, () => {
      if (this.props.tokenId) { this.getNFT(); }
    });
  }

  whitelist = async () => {
    this.setState({ is: 'loading' });

    const { tinlake } = this.props;
    const { tokenId, principal, appraisal, interestRate } = this.state;
    const addresses = tinlake.contractAddresses;

    try {
      // admit
      const nftOwner = await tinlake.ownerOfNFT(tokenId);

      console.log(`NFT owner of tokenId ${tokenId} is ${nftOwner}`);

      const res2 = await tinlake.adminAdmit(addresses['NFT_COLLATERAL'], tokenId, principal,
                                            nftOwner);

      console.log('admit result');
      console.log(res2.txHash);

      if (res2.status !== SUCCESS_STATUS || res2.events[0].event.name !== 'Transfer') {
        console.log(res2);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res2) });
        return;
      }

      const loanId = res2.events[0].data[2].toString();
      console.log(`Loan id: ${loanId}`);

      // appraise
      const res3 = await tinlake.adminAppraise(loanId, appraisal);

      console.log('appraisal results');
      console.log(res3.txHash);
      if (res3.status !== SUCCESS_STATUS) {
        console.log(res3);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res3) });
        return;
      }

      // init fee
      const fee = interestRateToFee(interestRate);
      const feeExists = await tinlake.existsFee(fee);
      if (!feeExists) {
        console.log(`Fee ${fee} does not yet exist, create it`);
        const res4 = await tinlake.initFee(fee);
        if (res4.status !== SUCCESS_STATUS) {
          console.log(res4);
          this.setState({ is: 'error', errorMsg: JSON.stringify(res4) });
          return;
        }
        console.log('Fee created');
      } else {
        console.log(`Fee ${fee} already exists`);
      }

      // add fee
      const res5 = await tinlake.addFee(loanId, fee, '0');
      if (res5.status !== SUCCESS_STATUS) {
        console.log(res5);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res5) });
        return;
      }
      console.log('Fee added');

      this.setState({ is: 'success' });
    } catch (e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  getNFT = async () => {
    const { tinlake, getNFT } = this.props;

    await getNFT!(tinlake, this.state.tokenId);
  }

  render() {
    const { tinlake, nft } = this.props;
    const { tokenId, principal, appraisal, interestRate, is, errorMsg } = this.state;

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <Link href="/admin">
            <LinkPrevious />
          </Link>
          <Heading level="3">Whitelist NFT</Heading>
        </Box>

        <Button onClick={this.whitelist} primary label="Whitelist"
          disabled={is === 'loading' || is === 'success'} />
      </SecondaryHeader>

      <Box pad={{ horizontal: 'medium' }}>
        {is === 'loading' && 'Whitelisting...'}
        {is === 'success' && <Alert type="success">
          Successfully whitelisted NFT for Token ID {tokenId}</Alert>}
        {is === 'error' && <Alert type="error">
          <Text weight="bold">
            Error whitelisting NFT for Token ID {tokenId}, see console for details</Text>
          {errorMsg && <div><br />{errorMsg}</div>}
        </Alert>}

        <Box direction="row" gap="medium" margin={{ vertical: 'large' }}>
          <Box basis={'1/4'} gap="medium">
            <FormField label="NFT ID">
              <TextInput
                value={tokenId}
                onChange={e => this.setState({ tokenId: e.currentTarget.value }, this.getNFT)}
                disabled={is === 'loading' || is === 'success'}
              />
            </FormField>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <FormField label="Appraisal">
              <NumberInput
                value={baseToDisplay(appraisal, 18)} suffix=" DAI" precision={18} autoFocus
                onChange={(masked: string, float: number) => float !== undefined &&
                  this.setState({ appraisal: displayToBase(masked, 18) })}
                disabled={is === 'loading' || is === 'success'}
              />
            </FormField>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <FormField label="Principal">
              <NumberInput
                value={baseToDisplay(principal, 18)} suffix=" DAI" precision={18}
                onChange={(masked: string, float: number) => float !== undefined &&
                  this.setState({ principal: displayToBase(masked, 18) })}
                disabled={is === 'loading' || is === 'success'}
              />
            </FormField>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <FormField label="Interest Rate (Yearly)">
              <NumberInput
                value={interestRate} suffix=" %" precision={2}
                onChange={(masked: string, float: number) => {
                  if (float !== undefined) {
                    console.log({ masked, float });
                    this.setState({ interestRate: `${float}` });
                  }
                }}
                disabled={is === 'loading' || is === 'success'}
              />
            </FormField>
          </Box>
        </Box>

        {nft!.state === 'loading' && 'Loading NFT data...'}
        {nft!.state === 'not found' && <Alert type="error" margin={{ vertical: 'large' }}>
          NFT for token ID {tokenId} not found.</Alert>}
        {nft!.state === 'found' && nft!.nft &&
          <NftData data={nft!.nft} authedAddr={tinlake.ethConfig.from} />}
      </Box>
    </Box>;
  }
}

export default connect(state => state, { getNFT })(WhitelistNFT);
