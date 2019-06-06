import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';
import { extractDate, formatCurrency, formatPercent } from '../../common/formaters';
import { FundingAgreementResponse } from '../../common/interfaces';


interface FundingAgreementProps {
  fundingAgreement: FundingAgreementResponse;
  columnGap: string;
};

export class FundingAgreement extends React.Component<FundingAgreementProps> {
  displayName = 'FundingAgreement';

  render() {
    const {
      fundingAgreement: { funding, signatures, nftOwner },
      columnGap,
    } = this.props;
    return (
      <Section headingLevel="5" title="Funding Agreement">
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
                value={signatures ? 'Accepted' : 'Pending'}
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

