import { DisplayField } from '@centrifuge/axis-display-field'
import { ITinlake } from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'
import { Box, Heading, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { createTransaction, TransactionProps } from '../../ducks/transactions'
import { getTransactionLink } from '../../utils/etherscanLinkGenerator'
import { usePool } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const ignoredEvents = ['Rely', 'Deny', 'Depend']

const AuditLog: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [events, setEvents] = React.useState([] as ethers.Event[])
  const [logs, setLogs] = React.useState([] as ethers.utils.LogDescription[])

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
            {logs.map((log: ethers.utils.LogDescription, id: number) => (
              <TableRow>
                <TableCell>{logs.length - id}</TableCell>
                <TableCell>{truncateString(`${log.name}(${log.args.join(',')})`, 75)}</TableCell>
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
