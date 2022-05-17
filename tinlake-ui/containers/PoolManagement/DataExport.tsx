import { ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
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

export interface CsvTransaction {
  currencyAmount: string
  gasPrice: number
  gasUsed: number
  newBalance: string
  owner: { id: string }
  pool: { shortName: string }
  symbol: string
  timestamp: string
  tokenPrice: string
  transaction: string
  type: string
}

const DataExport: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [loading, setLoading] = React.useState('' as string | number)
  const [file, setFile] = React.useState()
  const [csvData, setcsvData] = React.useState([] as CsvTransaction[])

  const download = async (name: keyof typeof queries, csvData?: CsvTransaction[]) => {
    if (!poolData || !props.tinlake.contractAddresses.ROOT_CONTRACT) return
    setLoading(name)
    setTimeout(async () => {
      await queries[name]({ poolData, poolId: props.tinlake.contractAddresses.ROOT_CONTRACT!, csvData })
      setLoading('')
    }, 1)
  }

  const fileReader = new FileReader()

  const handleOnChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleOnSubmit = (e) => {
    e.preventDefault()
    if (file) {
      fileReader.onload = function (event) {
        let csvOutput = event.target.result as string
        let parsedCSV: CsvTransaction[] = csvOutput
          .split(/\r?\n/)
          .filter((i) => parseInt(i[0]))
          .map((i) => {
            const arr = i.split(',')

            console.log('!!!', arr[0])
            console.log('!!!', arr[5])
            console.log('!!!', Math.floor(parseFloat(arr[5]) * 10 ** 8).toString())

            let output: CsvTransaction = {
              currencyAmount: new BN(Math.floor(parseFloat(arr[5]) * 10 ** 8).toString())
                .mul(new BN('10000000000'))
                .toString(),
              gasPrice: parseFloat(arr[11]) * 10 ** 9,
              gasUsed: parseInt(arr[12]),
              newBalance: new BN(Math.floor(parseFloat(arr[7]) * 10 ** 8).toString())
                .mul(new BN('10000000000'))
                .toString(),
              owner: { id: arr[2] },
              pool: { shortName: arr[1] },
              symbol: arr[4],
              timestamp: (Date.parse(arr[0]) / 1000).toString(),
              tokenPrice: new BN((parseFloat(arr[9]) * 10 ** 16).toString()).mul(new BN('100000000000')).toString(),
              transaction: arr[10],
              type: arr[3],
            }
            return output
          })
        setcsvData(parsedCSV)
        console.log(parsedCSV)
      }

      fileReader.readAsText(file)
    }
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
                      onClick={() =>
                        csvData.length
                          ? download(name as keyof typeof queries, csvData)
                          : download(name as keyof typeof queries)
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          <TableRow>
            <>
              <input type={'file'} id={'csvFileInput'} accept={'.csv'} onChange={handleOnChange} />
              <button
                onClick={(e) => {
                  handleOnSubmit(e)
                }}
              >
                IMPORT CSV
              </button>
            </>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  ) : null
}

export default connect((state) => state, { createTransaction })(DataExport)
