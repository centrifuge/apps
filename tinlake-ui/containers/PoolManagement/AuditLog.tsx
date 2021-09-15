import { DisplayField } from '@centrifuge/axis-display-field'
import { addThousandsSeparators, baseToDisplay, feeToInterestRate, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'
import { Box, Button, Heading, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { createTransaction, TransactionProps } from '../../ducks/transactions'
import { dateToYMD } from '../../utils/date'
import { getAddressLink, getTransactionLink } from '../../utils/etherscanLinkGenerator'
import { formatAddress } from '../../utils/formatAddress'
import { usePool } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const ignoredEvents = ['Depend']

const logsPerPage = 8

const AuditLog: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [{ events, logs, transactions, blocks }, setData] = React.useState({
    events: [] as ethers.Event[],
    logs: [] as ethers.utils.LogDescription[],
    transactions: [] as ethers.providers.TransactionResponse[],
    blocks: [] as ethers.providers.Block[],
  })

  const [start, setStart] = React.useState(0)

  const getEvents = async () => {
    const poolAdmin = props.tinlake.contract('POOL_ADMIN')
    const eventFilter = {
      address: poolAdmin.address,
      fromBlock: props.tinlake.provider.getBlockNumber().then((b) => b - 10000),
      toBlock: 'latest',
    }
    const newEvents = (await poolAdmin.queryFilter(eventFilter))
      .filter((e) => e !== undefined)
      .filter((e) => e.event && !ignoredEvents.includes(e.event))
      .reverse()

    const newLogs = newEvents.map((event) => {
      return poolAdmin.interface.parseLog(event)
    })

    const newTransactions = await Promise.all(events.map((e) => e.getTransaction()))
    const newBlocks = await Promise.all(events.map((e) => e.getBlock()))
    const newData = { events: newEvents, logs: newLogs, transactions: newTransactions, blocks: newBlocks }
    setData(newData)
  }

  React.useEffect(() => {
    getEvents()
  }, [])

  return poolData ? (
    <Box>
      <Card p="medium" mb="medium">
        <Heading level="5" margin={{ top: '0' }}>
          Audit Log
        </Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell size="12%">Date</TableCell>
              <TableCell size="14%">From</TableCell>
              <TableCell size="66%" pad={{ vertical: '6px' }}>
                Event
              </TableCell>
              <TableCell size="8%" pad={{ vertical: '6px' }} style={{ textAlign: 'right' }}>
                &nbsp;
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.slice(start, start + logsPerPage).map((log: ethers.utils.LogDescription, id: number) => (
              <TableRow>
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
                  <a href={getTransactionLink(events[start + id].transactionHash)} target="_blank">
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
    </Box>
  ) : null
}

export default connect((state) => state, { createTransaction })(AuditLog)

const DisplayFieldWrapper = styled.div`
  width: 100%;
  max-width: 100px;
  > div {
    padding: 0;
  }
`

const truncateString = (txt: string, num: number) => {
  if (txt.length > num) {
    return txt.slice(0, num) + '...'
  } else {
    return txt
  }
}

const generateLogName = (log: ethers.utils.LogDescription) => {
  if (log.name === 'AddRiskGroup') {
    return `Add risk group ${log.args[0]}, ${toPrecision(
      baseToDisplay(log.args[2], 25),
      0
    )}% Max Advance Rate, ${toPrecision(feeToInterestRate(log.args[3]), 2)}% Financing Fee`
  }
  if (log.name === 'AddWriteOffGroup') {
    return `Add write-off group, ${toPrecision(
      baseToDisplay(log.args[1], 25),
      0
    )}% write-off percentage, ${log.args[2].toString()} overdue days`
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

  return `${log.name}(${log.args.join(',')})`
}
