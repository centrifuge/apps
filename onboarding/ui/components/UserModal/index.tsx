import * as React from 'react'
import { Modal } from '@centrifuge/axis-modal'
import { Box, Table, TableBody, TableCell, TableRow } from 'grommet'
import styled from 'styled-components'
import { Agreement } from '@centrifuge/onboarding-api/src/repos/agreement.repo'
import { UserWithRelations } from '@centrifuge/onboarding-api/src/controllers/user.controller'
import { AddressEntity } from '@centrifuge/onboarding-api/src/repos/address.repo'
const countries = require('i18n-iso-countries')
import { useHotkeys } from 'react-hotkeys-hook'

interface Props {
  isOpen: boolean
  close: () => void
  user: UserWithRelations
  etherscanUrl: string
}

const UserModal: React.FC<Props> = (props: Props) => {
  const { user, agreements, addresses } = props.user

  useHotkeys(
    'ctrl+e, command+e',
    () => {
      if (props.isOpen && user && addresses.length > 0) {
        openInNewTab(`${props.etherscanUrl}/address/${addresses[0].address}`)
      }
    },
    [user, addresses]
  )

  useHotkeys(
    'ctrl+m, command+m',
    () => {
      if (props.isOpen && user) {
        openInNewTab(`mailto:${user.email}`)
      }
    },
    [user, addresses]
  )

  return (
    <Modal
      opened={props.isOpen}
      title={user.entityName || user.fullName}
      headingProps={{ style: { maxWidth: '100%', minWidth: '740px', display: 'flex' } }}
      onClose={props.close}
    >
      <Box direction="row" gap="medium">
        <Box basis="1/2">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">KYC Status</TableCell>
                <TableCell style={{ textAlign: 'end' }}>{ucfirst(user.status)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Accredited Investor</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {user.accredited ? 'Yes' : user.usaTaxResident ? 'No' : 'N/A'}
                </TableCell>
              </TableRow>
              {agreements.map((agreement: Agreement) => (
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

              {addresses.map((address: AddressEntity) => (
                <TableRow>
                  <TableCell scope="row">
                    {ucfirst(address.blockchain)} {ucfirst(address.network)}
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <a href={`${props.etherscanUrl}/address/${address.address}`} target="_blank">
                      {shorten(address.address, 4)}
                    </a>
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
                <TableCell style={{ textAlign: 'end' }}>{user.entityName ? 'Entity' : 'Individual'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Email address</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  <a href={`mailto:${user.email}`}>{user.email}</a>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Country</TableCell>
                <TableCell
                  style={{ textAlign: 'end', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}
                >
                  <div>{countries.getName(user.countryCode, 'en', { select: 'official' })}</div>
                  <Flag>
                    <img src={`https://www.countryflags.io/${user.countryCode}/flat/24.png`} />
                  </Flag>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row" border={{ color: 'transparent' }}>
                  US tax resident
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                  {user.usaTaxResident ? 'Yes' : 'No'}
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

const shorten = (addr: string, visibleChars: number) =>
  addr.substr(0, visibleChars) + '...' + addr.substr(addr.length - visibleChars)

const ucfirst = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const openInNewTab = (href: string) => {
  Object.assign(document.createElement('a'), {
    target: '_blank',
    href: href,
  }).click()
}
