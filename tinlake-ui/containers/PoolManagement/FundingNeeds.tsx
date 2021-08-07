import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Box, Button, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect, useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import Alert from '../../components/Alert'
import { LoadingValue } from '../../components/LoadingValue'
import { LoadPool, Pool } from '../../config'
import { loadLoans, LoansState, SortableLoan } from '../../ducks/loans'
import { loadPool, PoolData, PoolState } from '../../ducks/pool'
import { PoolsState } from '../../ducks/pools'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { Fixed27Base } from '../../utils/ratios'
import { toPrecision } from '../../utils/toPrecision'

interface Props extends TransactionProps {
  activePool: Pool
  tinlake: ITinlake
  loadPool?: LoadPool
}

const FundingNeeds: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const pools = useSelector<any, PoolsState>((state) => state.pools)
  const poolListData = pools.data?.pools.find((p) => p.id === props.activePool.addresses.ROOT_CONTRACT)

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

  const makerDropCollateralValue =
    isMakerIntegrated && poolData?.maker && poolData?.maker?.dropBalance && poolData.senior
      ? poolData?.maker?.dropBalance.mul(poolData.senior!.tokenPrice).div(new BN(10).pow(new BN(27)))
      : undefined

  const makerOvercollateralization =
    isMakerIntegrated && poolData?.maker && poolData?.maker?.dropBalance && poolData.senior
      ? makerDropCollateralValue
          .mul(new BN(10).pow(new BN(18)))
          .div(poolData?.maker.debt)
          .div(new BN(10).pow(new BN(16)))
      : new BN(0)

  const makerDropShare =
    isMakerIntegrated && poolData?.maker && poolData?.maker?.dropBalance && poolData.senior
      ? poolData?.maker?.dropBalance
          .mul(new BN(10).pow(new BN(18)))
          .div(poolData?.senior?.totalSupply)
          .div(new BN(10).pow(new BN(16)))
      : undefined

  const changedExternalCapacity = externalCapacity && externalCapacity !== (poolData?.reserve || new BN(0)).toString()
  const changedMakerCapacity = makerCapacity && mat && makerCapacity !== poolData?.maker?.creditline?.toString()

  const [status, , setTxId] = useTransactionState()
  const [creditlineStatus, , setCreditlineTxId] = useTransactionState()

  const save = async () => {
    if (changedExternalCapacity && externalCapacity) {
      const txId = await props.createTransaction(`Set max reserve`, 'setMaxReserve', [
        props.tinlake,
        externalCapacity.toString(),
      ])
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
          props.tinlake,
          amount.toString(),
        ])
        setCreditlineTxId(txId)
      } else {
        const txId = await props.createTransaction(`Lower credit line to ${formatted}`, 'sinkCreditline', [
          props.tinlake,
          amount.toString(),
        ])
        setCreditlineTxId(txId)
      }
    }
  }

  const dispatch = useDispatch()

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.loadPool && props.loadPool(props.tinlake, props.activePool?.metadata.maker?.ilk)
    }
  }, [status])

  React.useEffect(() => {
    dispatch(loadLoans(props.tinlake))
  }, [props.activePool])

  const loans = useSelector<any, LoansState>((state) => state.loans)
  const ongoingAssets = loans?.loans
    ? loans?.loans.filter((loan) => loan.status && loan.status === 'ongoing')
    : undefined
  const maxSingleLoan = ongoingAssets
    ? ongoingAssets
        .filter((loan) => loan.maturityDate && loan.financingDate)
        .reduce((currentMax: BN, loan: SortableLoan) => {
          return loan.debt.gt(currentMax) ? loan.debt : currentMax
        }, new BN(0))
    : new BN(0)

  return (
    <Box direction="row" width="100%" gap="medium">
      {isMakerIntegrated && (
        <Box basis="1/2" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }} background="white">
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
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.line || new BN(0), 45 + 6), 1))}M
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
                    {addThousandsSeparators(toPrecision(baseToDisplay(maxCreditline, 18 + 6), 1))}M DAI
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
                      toPrecision(baseToDisplay(poolData?.maker?.creditline || new BN(0), 18 + 6), 1)
                    )}
                    M DAI
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
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.debt || new BN(0), 18 + 6), 1))}M
                    DAI
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
                      toPrecision(baseToDisplay(poolData?.maker?.remainingCredit || new BN(0), 18 + 6), 1)
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Table margin={{ top: 'medium', bottom: '0' }}>
            <TableBody>
              <TableRow style={{ fontWeight: 'bold' }}>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  Maker Covenants
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  &nbsp;
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Co-investors ratio
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={makerDropShare !== undefined}>
                    {100 - parseFloat(makerDropShare || new BN(0).toString())} % &nbsp; &ge; &nbsp; 25%
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Overcollateralization
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={makerOvercollateralization !== undefined}>
                    {parseFloat((makerOvercollateralization || new BN(0)).toString())} % &nbsp; &ge;{' '}
                    {parseFloat((mat || new BN(0)).div(new BN(10).pow(new BN(25)))).toString()} %
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
                  Maximum single loan
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={maxSingleLoan !== undefined}>
                    {addThousandsSeparators(toPrecision(baseToDisplay(maxSingleLoan, 18 + 3), 0))}K DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Table margin={{ top: 'medium', bottom: '0' }}>
            <TableBody>
              <TableRow style={{ fontWeight: 'bold' }}>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                  border={{ color: 'transparent' }}
                >
                  TIN Tranche Value
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.junior.totalSupply !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay(
                          poolData?.junior.totalSupply.mul(poolData?.junior.tokenPrice) || new BN(0),
                          27 + 18 + 6
                        ),
                        1
                      )
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Locked for Min TIN Risk Buffer
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={poolData?.netAssetValue !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay(
                          poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.minJuniorRatio) || new BN(0),
                          27 + 18 + 6
                        ),
                        1
                      )
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  scope="row"
                  style={{ alignItems: 'start', justifyContent: 'center' }}
                  pad={{ vertical: '6px' }}
                >
                  Locked for Maker Overcollateralization
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                  <LoadingValue done={poolData?.maker?.mat !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay(
                          poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.maker?.mat.sub(Fixed27Base)) ||
                            new BN(0),
                          27 + 18 + 6
                        ),
                        1
                      )
                    )}
                    M DAI
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
                  Unlocked
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }} border={{ color: 'transparent' }}>
                  <LoadingValue done={poolData?.maker?.mat !== undefined}>
                    {addThousandsSeparators(
                      toPrecision(
                        baseToDisplay(
                          poolData?.junior.totalSupply
                            .mul(poolData?.junior.tokenPrice)
                            ?.sub(poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.minJuniorRatio))
                            .sub(
                              poolData?.netAssetValue.add(poolData?.reserve).mul(poolData?.maker?.mat.sub(Fixed27Base))
                            ) || new BN(0),
                          27 + 18 + 6
                        ),
                        1
                      )
                    )}
                    M DAI
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      )}
      <Box basis="1/2" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }} background="white">
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
          <Box margin={{ top: '0', bottom: 'medium' }}>
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
          label="External Investor Capacity"
          token={props.activePool?.metadata.currencySymbol || 'DAI'}
          value={
            externalCapacity === undefined
              ? (poolData?.maxReserve || new BN(0)).sub(poolData?.maker?.remainingCredit || new BN(0)).toString() || '0'
              : externalCapacity
          }
          onChange={onChangeExternalCapacity}
        />

        {poolListData?.capacity?.lt(
          new BN(
            externalCapacity === undefined
              ? (poolData?.maxReserve || new BN(0)).sub(poolData?.maker?.remainingCredit || new BN(0)).toString() || '0'
              : externalCapacity
          )
        ) && (
          <Alert margin={{ top: 'medium' }} type="info">
            The actual investor capacity is currently{' '}
            {addThousandsSeparators(toPrecision(baseToDisplay(poolListData?.capacity || new BN(0), 18), 0))} DAI because
            it's constrained by the TIN Risk Buffer.
          </Alert>
        )}

        <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
          <Button
            primary
            label="Save"
            onClick={save}
            disabled={
              (!changedExternalCapacity && !changedMakerCapacity) ||
              (changedExternalCapacity && (status === 'pending' || status === 'unconfirmed')) ||
              (changedMakerCapacity &&
                (creditlineStatus === 'pending' ||
                  creditlineStatus === 'unconfirmed' ||
                  (makerCapacity ? new BN(makerCapacity).gt(debtCeiling) : true)))
            }
          />
        </Box>
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadPool, createTransaction })(FundingNeeds)

const InlineIcon = styled.img`
  vertical-align: middle;
  margin: 0 4px 0 0;
  width: 16px;
  height: 16px;
  position: relative;
  top: -2px;
`
