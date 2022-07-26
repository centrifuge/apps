import { DisplayField } from '@centrifuge/axis-display-field'
import { addThousandsSeparators, baseToDisplay, feeToInterestRate, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { ethers } from 'ethers'
import { Box, Button, Heading, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import * as React from 'react'
import { useQuery } from 'react-query'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { createTransaction, TransactionProps } from '../../ducks/transactions'
import { dateToYMD } from '../../utils/date'
import { getAddressLink, getTransactionLink } from '../../utils/etherscanLinkGenerator'
import { formatAddress } from '../../utils/formatAddress'
import { Fixed27Base } from '../../utils/ratios'
import { usePool } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const ignoredEvents = ['Depend']

const logsPerPage = 8

export function useAdminLog(tinlake: ITinlake, poolId: string, ignoredEvents: string[]) {
  return useQuery(['adminLog', poolId], () => tinlake.getAuditLog(ignoredEvents))
}

const AdminLog: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [start, setStart] = React.useState(0)

  const { data: { events, logs, transactions, blocks } = {} } = useAdminLog(
    props.tinlake,
    props.tinlake.contractAddresses.ROOT_CONTRACT!,
    ignoredEvents
  )

  return poolData ? (
    <Box>
      {!(logs && events && transactions && blocks) && (
        <Card p="medium" mb="medium">
          Loading...
        </Card>
      )}
      {logs && events && transactions && blocks && (
        <Card p="medium" mb="medium">
          <Heading level="5" margin={{ top: '0' }}>
            List of all pool admin transactions
          </Heading>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell size="12%">Date</TableCell>
                <TableCell size="14%">From</TableCell>
                <TableCell size="66%">Event</TableCell>
                <TableCell size="8%" style={{ textAlign: 'right' }}>
                  &nbsp;
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(start, start + logsPerPage).map((log: ethers.utils.LogDescription, id: number) => (
                <TableRow key={id}>
                  <TableCell>{dateToYMD(blocks[start + id]?.timestamp || 0)}&nbsp;</TableCell>
                  <TableCell>
                    <DisplayFieldWrapper>
                      <DisplayField
                        as={'span'}
                        value={formatAddress(transactions[start + id]?.from || '0x0')}
                        link={{
                          href: getAddressLink(transactions[start + id]?.from || '0x0'),
                          target: '_blank',
                        }}
                      />
                    </DisplayFieldWrapper>
                  </TableCell>
                  <TableCell>{truncateString(generateLogName(log), 80)}</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <a href={getTransactionLink(events[start + id].transactionHash)} target="_blank" rel="noreferrer">
                      <img src="/static/wallet/external-link.svg" alt="View on Etherscan" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box direction="row" justify="center" margin={{ top: 'medium' }} gap="medium">
            <div>
              <Button
                size="small"
                primary
                label="Previous"
                onClick={() => setStart(start - logsPerPage < 0 ? 0 : start - logsPerPage)}
                disabled={start === 0}
              />
            </div>
            <div>
              <Button
                size="small"
                primary
                label="Next"
                onClick={() => setStart(start + logsPerPage)}
                disabled={logs.length < start + logsPerPage}
              />
            </div>
          </Box>
        </Card>
      )}
    </Box>
  ) : null
}

export default connect((state) => state, { createTransaction })(AdminLog)

const DisplayFieldWrapper = styled.div`
  width: 100%;
  max-width: 100px;
  > div {
    padding: 0;
  }
`

const truncateString = (txt: string, num: number) => {
  if (txt.length > num) {
    return `${txt.slice(0, num)}...`
  }
  return txt
}

const generateLogName = (log: ethers.utils.LogDescription) => {
  if (log.name === 'AddRiskGroup') {
    return `Add risk group ${log.args[0]} (${toPrecision(
      baseToDisplay(log.args[2], 25),
      0
    )}% Max Advance Rate, ${toPrecision(feeToInterestRate(log.args[3]), 2)}% Financing Fee)`
  }
  if (log.name === 'AddWriteOffGroup') {
    return `Add write-off group (${toPrecision(
      baseToDisplay(Fixed27Base.sub(new BN(log.args[1].toString())), 25),
      0
    )}% write-off percentage, ${log.args[2].toString()} overdue days)`
  }
  if (log.name === 'SetMaxReserve') {
    return `Set max reserve to ${addThousandsSeparators(toPrecision(baseToDisplay(log.args[0], 18), 0))} DAI`
  }
  if (log.name === 'RaiseCreditline') {
    return `Increase credit line by ${addThousandsSeparators(toPrecision(baseToDisplay(log.args[0], 18), 0))} DAI`
  }
  if (log.name === 'SinkCreditline') {
    return `Decrease credit line by ${addThousandsSeparators(toPrecision(baseToDisplay(log.args[0], 18), 0))} DAI`
  }
  if (log.name === 'UpdateSeniorMember') {
    return `Add ${formatAddress(log.args[0])} as DROP investor`
  }
  if (log.name === 'UpdateJuniorMember') {
    return `Add ${formatAddress(log.args[0])} as TIN investor`
  }
  if (log.name === 'Rely') {
    return `Rely ${formatAddress(log.args[0])} as level ${log.args[1]} admin`
  }
  if (log.name === 'Deny') {
    return `Deny ${formatAddress(log.args[0])} as admin`
  }
  if (log.name === 'HealCreditline') {
    return `Heal credit line overcollateralization`
  }
  if (log.name === 'SetMinimumEpochTime') {
    const seconds = Number(log.args[0].toString())
    const hours = Math.floor(seconds / 60 / 60)
    const minutes = Math.round((seconds / 60 / 60 - hours) * 60)
    return `Set minimum epoch time to ${hours > 0 ? `${hours} hours and ${minutes}` : minutes} minutes`
  }
  if (log.name === 'SetChallengeTime') {
    const minutes = Math.round(Number(log.args[0].toString()) / 60)
    return `Set challenge time to ${minutes} minutes`
  }
  if (log.name === 'SetDiscountRate') {
    return `Set discount rate to ${toPrecision(feeToInterestRate(log.args[0]), 2)}%`
  }
  if (log.name === 'UpdateNFTMaturityDate') {
    return `Update maturity date for NFT ${formatAddress(log.args[0])} to ${dateToYMD(log.args[1])}`
  }
  if (log.name === 'UpdateNFTValue') {
    return `Update value for NFT ${formatAddress(log.args[0])} to ${addThousandsSeparators(
      toPrecision(baseToDisplay(log.args[1], 18), 0)
    )} DAI`
  }
  if (log.name === 'UpdateNFTValueRisk') {
    return `Update risk group & value for NFT ${formatAddress(log.args[0])} to ${
      log.args[2]
    } and ${addThousandsSeparators(toPrecision(baseToDisplay(log.args[1], 18), 0))} DAI`
  }
  if (log.name === 'OverrideWriteOff') {
    return `Override write-off asset ${log.args[0]} to write-off group ${log.args[1]}`
  }
  if (log.name === 'ClosePool') {
    return `Close the pool`
  }
  if (log.name === 'UnclosePool') {
    return `Unclose the pool`
  }

  return `${log.name}(${log.args.join(',')})`
}
