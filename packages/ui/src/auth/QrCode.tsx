import React, { FunctionComponent, useEffect, useState } from 'react';
import { Box } from 'grommet';
import QRCode from 'qrcode';
import { User } from '@centrifuge/gateway-lib/models/user';
import styled from 'styled-components';
import TwoFAForm from './TwoFAForm';

interface Props {
  user: User;
  onSubmit: (values: any) => void;
  error?: Error;
}

const QrImage = styled.img`
  width: 60%;
`;

const Step = styled.h4`
  margin-top: 0px;
`;
const QrCode: FunctionComponent<Props> = (props: Props) => {
  const [qrCode, setQrCode] = useState();
  const { error, user, onSubmit } = props;

  useEffect(() => {
    QRCode.toDataURL(user!.secret!.otpauth_url).then(result => {
      setQrCode(result);
    });
  }, [user]);

  return (
    <>
      <h2>2 Factor Authentication Setup</h2>
      <Step>1. Install Authy on your mobile phone</Step>
      <Step>2. Press add account in Authy</Step>
      <Step>3. Scan the QR Code</Step>
      <Box align={'center'}>
        <QrImage src={qrCode} />
      </Box>

      <Step>3. Verify security code</Step>

      <TwoFAForm user={user!} error={error} onSubmit={onSubmit} />
    </>
  );
};

export default QrCode;
