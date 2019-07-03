import React from 'react';
import { Text } from 'grommet';
import { STATUS } from '../common/status';

export const Status = (props => {
  const { value } = props;
  let color = '';
  switch (value) {
    case STATUS.REPAID:
      color = 'status-ok';
      break;
    case STATUS.REPAYING_FUNDING:
    case STATUS.SENDING_FUNDING:
      color = 'status-warning'
  }

  return (
    <Text color={color}>{value}</Text>
  );
});
