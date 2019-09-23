import React, { FunctionComponent } from 'react';
import { Box, Heading, Paragraph } from 'grommet';
import { AxiosError } from 'axios';


type Props = {
  error: Error | AxiosError;
}
export const PageError: FunctionComponent<Props> = ({ error }) => {

  let title = 'Error';
  let message = error.message;

  if (error.hasOwnProperty('isAxiosError')) {
    const axiosError = error as AxiosError;
    title = axiosError!.response!.status.toString();
    message = axiosError!.response!.data.message || axiosError!.response!.statusText;
  }

  return <Box width={'100%'} align={'center'} justify={'center'} height={'calc(100vh - 90px)'} direction={'row'}
              gap={'medium'}>
    <Box border={{ side: 'right' }} pad={{ horizontal: 'medium' }}>
      <Heading level={3}>
        {title}
      </Heading>
    </Box>

    <Paragraph>
      {message}
    </Paragraph>
  </Box>;
};
