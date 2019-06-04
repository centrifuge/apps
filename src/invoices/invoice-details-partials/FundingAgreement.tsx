import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';
import { FunFundingResponseData } from '../../../clients/centrifuge-node';
import { extractDate, formatCurrency, formatPercent } from '../../common/formaters';


interface FundingAgreementProps {
  fundingAgreement: FunFundingResponseData;
  columnGap: string;
};

export class FundingAgreement extends React.Component<FundingAgreementProps> {
  displayName = 'FundingAgreement';

  render() {
    const {
      fundingAgreement: { funding, signatures },
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
                label={`Finance amount`}
                value={formatCurrency(funding!.amount,funding!.currency)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label="Finance APR"
                value={formatPercent(funding!.apr)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label="Fee"
                value={formatPercent(funding!.fee)}
              />
            </Box>
          </Box>

          <Box direction="row" gap={columnGap} flex="grow">
            <Box basis={'1/4'}>
              <DisplayField
                label="Repayment Due Date"
                value={extractDate(funding!.repayment_due_date)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label={`Repayment Amount`}
                value={formatCurrency(funding!.repayment_amount,funding!.currency)}
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
                value={signatures ? 'Accepted' : 'Pending'}
              />
            </Box>

          </Box>

        </Box>
      </Section>
    );

  }
}

