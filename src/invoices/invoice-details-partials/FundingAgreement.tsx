import React from 'react';
import { Box } from 'grommet';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';
import { formatCurrency, formatDate, formatPercent } from '../../common/formaters';
import { FundingAgreementResponse, LabelValuePair } from '../../common/interfaces';
import { Status } from '../../components/Status';
import { getAddressLink, getNFTLink } from '../../common/etherscan';


interface FundingAgreementProps {
  fundingAgreement: FundingAgreementResponse;
  contacts: LabelValuePair[];
  fundingStatus: string,
  columnGap: string;
};

export class FundingAgreement extends React.Component<FundingAgreementProps> {
  displayName = 'FundingAgreement';

  render() {
    const {
      fundingAgreement: { funding, nftOwner, nftRegistry },
      fundingStatus,
      contacts,
      columnGap,
    } = this.props;

    const funderContact = contacts.find(c => c.value.toLowerCase() === funding!.funder_id!.toLowerCase());


    return (
      <Section headingLevel="5" title="Funding Agreement" background={'light-1'}>
        <Box gap={columnGap}>
          <Box direction="row" gap={columnGap} flex="grow">
            <Box basis={'1/4'}>
              <DisplayField
                label="Funding agreement ID"
                value={funding!.agreement_id}
              />
            </Box>
            <Box basis={'1/4'}>
              <DisplayField
                label="NFT ID"
                value={funding!.nft_address}
                linkTo={getNFTLink(funding!.nft_address, nftRegistry)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label="NFT owner"
                value={nftOwner}
                linkTo={getAddressLink(nftOwner)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label="Funding status"
                value={<Status value={fundingStatus}/>}
              />
            </Box>
          </Box>

          <Box direction="row" gap={columnGap} flex="grow">
            <Box basis={'1/4'}>
              <DisplayField
                label="Repayment due date"
                value={formatDate(funding!.repayment_due_date)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label={`Early payment amount`}
                value={formatCurrency(funding!.amount, funding!.currency)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label={`Repayment amount`}
                value={formatCurrency(funding!.repayment_amount, funding!.currency)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label="Finance APR"
                value={formatPercent(funding!.apr)}
              />
            </Box>
          </Box>

          <Box direction="row" gap={columnGap} flex="grow">
            <Box basis={'1/4'}>
              <DisplayField
                label="Funder"
                value={funderContact ? funderContact.label : funding!.funder_id}
              />
            </Box>

            <Box basis={'1/4'}>
            </Box>
            <Box basis={'1/4'}></Box>
            <Box basis={'1/4'}></Box>


          </Box>

        </Box>
      </Section>
    );

  }
}

