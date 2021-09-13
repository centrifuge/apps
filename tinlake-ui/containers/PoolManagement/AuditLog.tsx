import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay, feeToInterestRate, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'
import { Box, Button, Heading, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { createTransaction, TransactionProps } from '../../ducks/transactions'
import { getTransactionLink } from '../../utils/etherscanLinkGenerator'
import { formatAddress } from '../../utils/formatAddress'
import { usePool } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const ignoredEvents = ['Depend']

const logsPerPage = 10

const AuditLog: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [events, setEvents] = React.useState([] as ethers.Event[])
  const [logs, setLogs] = React.useState([] as ethers.utils.LogDescription[])
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

    setEvents(newEvents)

    setLogs(
      newEvents.map((event) => {
        return poolAdmin.interface.parseLog(event)
      })
    )
  }

  React.useEffect(() => {
    getEvents()
  }, [])

  return poolData && poolData.risk && poolData.writeOffGroups ? (
    <Box>
      <Card p="medium" mb="medium">
        <Heading level="5" margin={{ top: '0' }}>
          Audit Log
        </Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell size="5%">#</TableCell>
              <TableCell size="30%" pad={{ vertical: '6px' }}>
                Event
              </TableCell>
              <TableCell size="30%" pad={{ vertical: '6px' }} style={{ textAlign: 'right' }}>
                Transaction
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.slice(start, start + logsPerPage).map((log: ethers.utils.LogDescription, id: number) => (
              <TableRow>
                <TableCell>{logs.length - start - id}</TableCell>
                <TableCell>{truncateString(generateLogName(log), 80)}</TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <DisplayFieldWrapper>
                    <DisplayField
                      copy={true}
                      as={'span'}
                      value={events[id].transactionHash}
                      link={{
                        href: getTransactionLink(events[id].transactionHash),
                        target: '_blank',
                      }}
                    />
                  </DisplayFieldWrapper>
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
  max-width: 200px;
  margin-left: auto;
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
  if (log.name === 'Rely') {
    return `Rely ${formatAddress(log.args[0])} as level ${log.args[1]} admin`
  }
  if (log.name === 'Deny') {
    return `Deny ${formatAddress(log.args[0])} as admin`
  }

  return `${log.name}(${log.args.join(',')})`
}
