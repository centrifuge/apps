import * as React from 'react'
import { Modal } from '@centrifuge/axis-modal'
import { UserWithKyc } from '@centrifuge/onboarding-api/src/repos/user.repo'
import { Box, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import styled from 'styled-components'
import { Agreement } from '@centrifuge/onboarding-api/src/repos/agreement.repo'
const countries = require('i18n-iso-countries')

interface Props {
  isOpen: boolean
  close: () => void
  user: UserWithKyc
  agreements: Agreement[]
}

const UserModal: React.FC<Props> = (props: Props) => {
  return (
    <Modal
      opened={props.isOpen}
      title={props.user.entityName || props.user.fullName}
      headingProps={{ style: { maxWidth: '100%', minWidth: '740px', display: 'flex' } }}
      onClose={props.close}
    >
      <Box direction="row" gap="medium">
        <Box basis="1/2">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">KYC Status</TableCell>
                <TableCell style={{ textAlign: 'end' }}>{props.user.status}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Accredited Investor</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {props.user.accredited ? 'Yes' : props.user.usaTaxResident ? 'No' : 'N/A'}
                </TableCell>
              </TableRow>
              {props.agreements.map((agreement: Agreement) => (
                <TableRow>
                  <TableCell scope="row">{agreement.name}</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    {agreement.counterSignedAt
                      ? 'Signed'
                      : agreement.signedAt
                      ? 'Awaiting counter-signature'
                      : 'Unsigned'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box basis="1/2">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Type</TableCell>
                <TableCell style={{ textAlign: 'end' }}>{props.user.entityName ? 'Entity' : 'Individual'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Email address</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  <a href={`mailto:${props.user.email}`}>{props.user.email}</a>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Country</TableCell>
                <TableCell
                  style={{ textAlign: 'end', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}
                >
                  <div>{countries.getName(props.user.countryCode, 'en', { select: 'official' })}</div>
                  <Flag>
                    <img src={`https://www.countryflags.io/${props.user.countryCode}/flat/24.png`} />
                  </Flag>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row" border={{ color: 'transparent' }}>
                  US tax resident
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                  {props.user.usaTaxResident ? 'Yes' : 'No'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Modal>
  )
}

export default UserModal

const Flag = styled.div`
  margin-left: 10px;
  display: inline-block;

  img {
    width: 18px;
    height: 18px;
    position: relative;
    top: 2px;
  }
`
