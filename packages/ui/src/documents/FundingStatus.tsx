import React from 'react';
import { Text } from 'grommet';

export enum FUNDING_STATUS {
  NO_STATUS = '',
  PENDING = 'Requested',
  ACCEPTED = 'Accepted',
  SETTLED = 'Settled',
  REPAID = 'Repaid',
  UNKNOWN = 'Unknown',
  REPAYING_FUNDING = 'Repaying',
  SENDING_FUNDING = 'Funding',
  FUNDED = 'Funded',

}


export const FundingStatus = (props => {
  const { value } = props;
  let color = '';
  switch (value) {
    case FUNDING_STATUS.REPAID:
      color = 'status-ok';
      break;
    case FUNDING_STATUS.REPAYING_FUNDING:
    case FUNDING_STATUS.SENDING_FUNDING:
    case FUNDING_STATUS.PENDING:
      color = 'status-warning'
  }

  return (
    <Text color={color}>{value}</Text>
  );
});
