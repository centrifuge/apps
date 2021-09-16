import { ITinlake } from '@centrifuge/tinlake-js'
import { Button, Heading, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Card } from '../../components/Card'
import { Pool } from '../../config'
import { createTransaction, TransactionProps } from '../../ducks/transactions'
import { usePool } from '../../utils/usePool'
import queries from './queries'

interface Props extends TransactionProps {
  tinlake: ITinlake
  activePool: Pool
}

const DataExport: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [loading, setLoading] = React.useState('' as string | number)

  const download = async (name: keyof typeof queries) => {
    setLoading(name)
    setTimeout(async () => {
      await queries[name](props.tinlake.contractAddresses.ROOT_CONTRACT!)
      setLoading('')
    }, 1)
  }

  return poolData ? (
    <Card p="medium" mb="medium">
      <Heading level="5" margin={{ top: '0' }}>
        Data Export
      </Heading>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell size="80%">Datasets for {props.activePool.metadata.shortName}</TableCell>
            <TableCell size="20%">&nbsp;</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(queries)
            .sort()
            .map((name: string, index: number) => (
              <TableRow key={name}>
                <TableCell border={index === Object.keys(queries).length - 1 ? { color: 'transparent' } : undefined}>
                  {name}
                </TableCell>
                <TableCell
                  style={{ textAlign: 'right' }}
                  border={index === Object.keys(queries).length - 1 ? { color: 'transparent' } : undefined}
                >
                  <div>
                    <Button
                      size="small"
                      primary
                      label={loading === name ? 'Loading...' : 'Download'}
                      disabled={loading === name}
                      onClick={() => download(name as keyof typeof queries)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Card>
  ) : null
}

export default connect((state) => state, { createTransaction })(DataExport)
