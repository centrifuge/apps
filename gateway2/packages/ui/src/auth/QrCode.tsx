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
const Stepper = styled.ol`
  margin: 0px;
  padding:0px;
  list-style-position:inside;
`;

const Step = styled.li`
  margin-top: 0px;
  margin-bottom: 12px;
  font-weight: bold;
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
      <Stepper>
      <Step>Install Authentificator App on your mobile phone (e.g Google Authentificator or Authy)</Step>
      <Step>Add new account in your app</Step>
      <Step>Scan the QR Code</Step>
      <Box align={'center'}>
        <QrImage src={qrCode} />
      </Box>

      <Step>Input the generated security code</Step>
      </Stepper>
      <TwoFAForm user={user!} error={error} onSubmit={onSubmit} />
    </>
  );
};

export default QrCode;
