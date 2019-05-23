import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';
import { FunFundingResponseData } from '../../../clients/centrifuge-node';
import { dateFormatter } from '../../common/formaters';


interface FundingAgreementProps {
  fundingAgreement: FunFundingResponseData;
  columnGap: string;
};

export class FundingAgreement extends React.Component<FundingAgreementProps> {
  displayName = 'FundingAgreement';

  render() {
    const {
      fundingAgreement: { funding, signature },
      columnGap,
    } = this.props;
    return (
      <Section headingLevel="5" title="Funding Agreement">
        <Box gap={columnGap}>
          <Box direction="row" gap={columnGap} flex="grow">
            <Box basis={'1/4'}>
              <DisplayField
                label="Funding Agreement ID"
                value={funding!.funding_id}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label={`Finance amount,${funding!.currency}`}
                value={funding!.funding_id}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label="Finance APR. %"
                value={funding!.apr}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label="Fee. %"
                value={funding!.fee}
              />
            </Box>
          </Box>

          <Box direction="row" gap={columnGap} flex="grow">
            <Box basis={'1/4'}>
              <DisplayField
                label="Repayment Due Date"
                value={dateFormatter(funding!.repayment_due_date)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label={`Repayment Amount,${funding!.currency}`}
                value={funding!.repayment_amount}
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
                label="Funding Status"
                value={signature ? "Accepted" : "Pending"}
              />
            </Box>

          </Box>

        </Box>
      </Section>
    );

  }
}

