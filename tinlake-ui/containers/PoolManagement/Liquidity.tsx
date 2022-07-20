import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import { LoadingValue } from '../../components/LoadingValue'
import { useTinlake } from '../../components/TinlakeProvider'
import { Pool } from '../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { Fixed27Base } from '../../utils/ratios'
import { toPrecision } from '../../utils/toPrecision'
import { usePool } from '../../utils/usePool'

interface Props extends TransactionProps {
  activePool: Pool
}

const Liquidity: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const { data: poolData, refetch: refetchPoolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  const isMakerIntegrated =
    props.activePool.addresses.CLERK !== undefined && props.activePool.metadata.maker?.ilk !== ''

  const [makerCapacity, setMakerCapacity] = React.useState<string | undefined>(undefined)

  const onChangeMakerCapacity = (newValue: string) => {
    setMakerCapacity(newValue)
  }

  const [externalCapacity, setExternalCapacity] = React.useState<string | undefined>(undefined)

  const onChangeExternalCapacity = (newValue: string) => {
    setExternalCapacity(newValue)
  }

  // TODO: refactor
  const mat = poolData?.maker?.mat

  const debtCeiling = (poolData?.maker?.line || new BN('0')).div(new BN(10).pow(new BN(45 - 18)))
  const maxRaise = mat
    ? (poolData?.netAssetValue || new BN(0))
        .add(poolData?.reserveAndRemainingCredit || new BN(0))
        .mul(Fixed27Base.sub(poolData?.minJuniorRatio || new BN(0)))
        .div(Fixed27Base)
        .sub(poolData?.senior?.debt || new BN(0))
        .sub(poolData?.senior?.balance || new BN(0))
        .div(
          (mat || new BN(0))
            .sub(Fixed27Base)
            .sub(Fixed27Base)
            .mul(Fixed27Base.sub(poolData?.minJuniorRatio || new BN(0)))
            .div(Fixed27Base)
            .add(Fixed27Base)
            .div(new BN(10).pow(new BN(27 - 18)))
        )
        .mul(new BN(10).pow(new BN(27 + 18)))
        .div(mat || new BN(0))
    : new BN(0)

  const maxCreditline = (poolData?.maker?.creditline || new BN(0)).add(maxRaise)

  const changedExternalCapacity = externalCapacity && externalCapacity !== (poolData?.reserve || new BN(0)).toString()
  const changedMakerCapacity = makerCapacity && mat && makerCapacity !== poolData?.maker?.creditline?.toString()

  const [status, , setTxId] = useTransactionState()
  const [creditlineStatus, , setCreditlineTxId] = useTransactionState()

  const save = async () => {
    if (changedExternalCapacity && externalCapacity) {
      const maxReserve = new BN(externalCapacity).add(poolData?.maker?.remainingCredit || new BN(0)).toString()
      const txId = await props.createTransaction(`Set max reserve`, 'setMaxReserve', [tinlake, maxReserve])
      setTxId(txId)
    }

    if (changedMakerCapacity && makerCapacity) {
      const currentCreditline = poolData?.maker?.creditline?.toString()
      const amount = new BN(makerCapacity).gt(new BN(currentCreditline))
        ? new BN(makerCapacity).sub(new BN(currentCreditline))
        : new BN(currentCreditline).sub(new BN(makerCapacity))
      const valueToDecimal = new Decimal(baseToDisplay(makerCapacity, 18)).toDecimalPlaces(4)
      const formatted = addThousandsSeparators(valueToDecimal.toString())

      if (new BN(makerCapacity).gt(new BN(currentCreditline))) {
        const txId = await props.createTransaction(`Increase credit line to ${formatted}`, 'raiseCreditline', [
          tinlake,
          amount.toString(),
        ])
        setCreditlineTxId(txId)
      } else {
        const txId = await props.createTransaction(`Lower credit line to ${formatted}`, 'sinkCreditline', [
          tinlake,
          amount.toString(),
        ])
        setCreditlineTxId(txId)
      }
    }
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      refetchPoolData()
    }
  }, [status])

  return (
    <Box direction="row" width="100%" gap="medium">
      <Card flexBasis="50%" p="medium" mb="medium">
        <Heading level="5" margin={{ top: '0', bottom: 'small' }}>
          Pool Liquidity
        </Heading>
        <Table margin={{ bottom: 'medium' }}>
          <TableBody>
            <TableRow style={{ fontWeight: 'bold' }}>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
                border={{ color: 'transparent' }}
              >
                Available for Originations
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                <LoadingValue done={poolData?.availableFunds !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.availableFunds || new BN(0), 18), 0))} DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
              >
                <span>
                  <InlineIcon src={`/static/plus.svg`} /> Investment Orders
                </span>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                <LoadingValue done={poolData?.senior?.pendingInvestments !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(
                      baseToDisplay(
                        (poolData?.senior?.pendingInvestments || new BN(0)).add(
                          poolData?.junior?.pendingInvestments || new BN(0)
                        ),
                        18
                      ),
                      0
                    )
                  )}{' '}
                  DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
                border={isMakerIntegrated ? { color: 'transparent' } : undefined}
              >
                <span>
                  <InlineIcon src={`/static/min.svg`} /> Redemption Orders
                </span>
              </TableCell>
              <TableCell
                style={{ textAlign: 'end' }}
                pad={{ vertical: '6px' }}
                border={isMakerIntegrated ? { color: 'transparent' } : undefined}
              >
                <LoadingValue done={poolData?.totalRedemptionsCurrency !== undefined}>
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay(poolData?.totalRedemptionsCurrency || new BN(0), 18), 0)
                  )}{' '}
                  DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
            {!isMakerIntegrated && (
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  <span>
                    <InlineIcon src={`/static/plus.svg`} /> Available in Next Epoch (repaid)
                  </span>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.totalRedemptionsCurrency !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay((poolData?.reserve || new BN(0)).sub(poolData?.availableFunds || new BN(0)), 18),
                        0
                      )
                    )}{' '}
                    DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {isMakerIntegrated && (
          <Table margin={{ bottom: '0' }}>
            <TableBody>
              <TableRow style={{ fontWeight: 'bold' }}>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  Debt Ceiling
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker.line !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay((poolData?.maker?.line || new BN(0)).div(Fixed27Base), 18), 0)
                    )}{' '}
                    DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Max Locked Credit Line given TIN
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={maxCreditline !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(maxCreditline, 18), 0))} DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Locked Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={poolData?.maker.creditline !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay(poolData?.maker?.creditline || new BN(0), 18), 0)
                    )}{' '}
                    DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Utilized Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={poolData?.maker?.debt !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.debt || new BN(0), 18), 0))} DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  Available Credit Line
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker?.remainingCredit !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay(poolData?.maker?.remainingCredit || new BN(0), 18), 0)
                    )}{' '}
                    DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Card>
      <Card flexBasis="50%" p="medium" mb="medium">
        <Heading level="5" margin={{ top: '0', bottom: 'small' }}>
          Liquidity Management
        </Heading>
        {isMakerIntegrated && (
          <Box margin={{ top: 'medium', bottom: 'medium' }}>
            <TokenInput
              label="Locked Credit Line"
              token={props.activePool?.metadata.currencySymbol || 'DAI'}
              value={makerCapacity === undefined ? poolData?.maker?.creditline?.toString() || '0' : makerCapacity}
              onChange={onChangeMakerCapacity}
              maxValue={(maxCreditline.lt(debtCeiling) ? maxCreditline : debtCeiling).toString()}
            />
          </Box>
        )}
        <TokenInput
          label={isMakerIntegrated ? 'External Investor Capacity' : 'Max reserve'}
          token={props.activePool?.metadata.currencySymbol || 'DAI'}
          value={
            externalCapacity === undefined
              ? (poolData?.maxReserve || new BN(0)).sub(poolData?.maker?.remainingCredit || new BN(0)).toString() || '0'
              : externalCapacity
          }
          onChange={onChangeExternalCapacity}
        />

        <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
          <Button
            primary
            label="Update"
            onClick={save}
            disabled={
              !poolData?.isPoolAdmin ||
              (!changedExternalCapacity && !changedMakerCapacity) ||
              (changedExternalCapacity && (status === 'pending' || status === 'unconfirmed')) ||
              (changedMakerCapacity &&
                (creditlineStatus === 'pending' ||
                  creditlineStatus === 'unconfirmed' ||
                  (makerCapacity ? new BN(makerCapacity).gt(debtCeiling) : true)))
            }
          />
        </Box>
      </Card>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(Liquidity)

const InlineIcon = styled.img`
  vertical-align: middle;
  margin: 0 4px 0 0;
  width: 16px;
  height: 16px;
  position: relative;
  top: -2px;
`
