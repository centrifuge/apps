import React from 'react';
import { Text } from 'grommet';
import { FUNDING_STATUS } from '../common/status';

export const Status = (props => {
  const { value } = props;
  let color = '';
  switch (value) {
    case FUNDING_STATUS.REPAID:
      color = 'status-ok';
      break;
    case FUNDING_STATUS.REPAYING_FUNDING:
    case FUNDING_STATUS.SENDING_FUNDING:
      color = 'status-warning'
  }

  return (
    <Text color={color}>{value}</Text>
  );
});
