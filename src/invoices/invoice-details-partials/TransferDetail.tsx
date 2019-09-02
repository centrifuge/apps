import React from 'react';
import { Box } from 'grommet';
import { DisplayField } from '@centrifuge/axis-display-field';
import { Section } from '../../components/Section';
import { formatCurrency } from '../../common/formaters';
import { TransferdetailsData } from '../../../clients/centrifuge-node';
import {  getTransactionLink } from '../../common/etherscan';


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
        {transfer && <Section headingLevel="5" title={title}  background={'light-1'}>
          <Box gap={columnGap}>
            <Box direction="row" gap={columnGap} flex="grow">
              <Box basis={'1/2'}>
                <DisplayField
                  label="Transaction Id"
                  value={transfer!.settlement_reference}
                  link={{
                    href:getTransactionLink(transfer!.settlement_reference),
                    target:'_blank'
                  }}
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

            </Box>
          </Box>
        </Section>}
      </>

    );

  }
}

