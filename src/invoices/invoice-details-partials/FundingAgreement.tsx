import React from 'react';
import { Box } from 'grommet';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';
import { extractDate, formatCurrency, formatPercent } from '../../common/formaters';
import { FundingAgreementResponse } from '../../common/interfaces';
import { Status } from '../../components/Status';


interface FundingAgreementProps {
  fundingAgreement: FundingAgreementResponse;
  fundingStatus: string,
  columnGap: string;
};

export class FundingAgreement extends React.Component<FundingAgreementProps> {
  displayName = 'FundingAgreement';

  render() {
    const {
      fundingAgreement: { funding, nftOwner },
      fundingStatus,
      columnGap,
    } = this.props;
    return (
      <Section headingLevel="5" title="Funding Agreement"  background={'light-1'}>
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
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label="NFT owner"
                value={nftOwner}
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
                value={extractDate(funding!.repayment_due_date)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label={`Finance amount`}
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

        </Box>
      </Section>
    );

  }
}

