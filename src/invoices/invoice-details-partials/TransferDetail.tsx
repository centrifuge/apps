import React from 'react';
import { Box } from 'grommet';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';
import { formatCurrency } from '../../common/formaters';
import { TransferdetailsData } from '../../../clients/centrifuge-node';


interface TransferDetailProps {
  transfer: TransferdetailsData;
  title: string;
  columnGap: string;
};

export class TransferDetail extends React.Component<TransferDetailProps> {
  displayName = 'TransferDetail';

  render() {
    const {
      transfer,
      title,
      columnGap,
    } = this.props;

    return (
      <>
        {transfer && <Section headingLevel="5" title={title}>
          <Box gap={columnGap}>
            <Box direction="row" gap={columnGap} flex="grow">
              <Box basis={'1/2'}>
                <DisplayField
                  label="Transaction Id"
                  value={transfer!.settlement_reference}
                  linkTo={`https://etherscan.io/tx/${transfer!.settlement_reference}`}
                />
              </Box>

              <Box basis={'1/4'}>
                <DisplayField
                  label={`Amount`}
                  value={formatCurrency(transfer!.amount, transfer!.currency)}
                />
              </Box>

              <Box basis={'1/4'}>
                <DisplayField
                  label="Status"
                  value={transfer.status}
                />
              </Box>

              {/*  <Box basis={'1/4'}>
                <DisplayField
                  label="Settlement date"
                  value={formatDate(transfer!.settlement_date)}
                />
              </Box>*/}
            </Box>
          </Box>
        </Section>}
      </>

    );

  }
}

