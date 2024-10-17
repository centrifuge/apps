import {
  ActiveLoan,
  CreatedLoan,
  CurrencyBalance,
  CurrencyKey,
  CurrencyMetadata,
  ExternalLoan,
} from '@centrifuge/centrifuge-js'
import {
  useCentrifugeApi,
  useCentrifugeQuery,
  useCentrifugeTransaction,
  useEvmProvider,
  useWallet,
} from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  CurrencyInput,
  Divider,
  Drawer,
  IconArrowRight,
  IconClockForward,
  IconDownload,
  Shelf,
  Stack,
  Text,
  Thumbnail,
} from '@centrifuge/fabric'
import { stringToHex } from '@polkadot/util'
import { BN } from 'bn.js'
import { Field, FieldProps, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Observable, catchError, combineLatest, from, map, of, switchMap } from 'rxjs'
import daiLogo from '../../assets/images/dai-logo.svg'
import usdcLogo from '../../assets/images/usdc-logo.svg'
import { ButtonGroup } from '../../components/ButtonGroup'
import { DataTable } from '../../components/DataTable'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { AssetName } from '../../components/LoanList'
import { RouterTextLink } from '../../components/TextLink'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useLiquidity } from '../../utils/useLiquidity'
import { useActiveDomains } from '../../utils/useLiquidityPools'
import { useSuitableAccounts } from '../../utils/usePermissions'
import { usePool, usePoolAccountOrders, usePoolFees } from '../../utils/usePools'
import { usePoolsForWhichAccountIsFeeder } from '../../utils/usePoolsForWhichAccountIsFeeder'
import { nonNegativeNumber } from '../../utils/validation'
import { isCashLoan, isExternalLoan } from '../Loan/utils'

type Attestation = {
  portfolio: {
    decimals: number
    assets: {
      asset: string
      quantity: string
      price: string
    }[]
    netAssetValue: string
    netFeeValue: string
    tokenSupply: string[]
    tokenPrice: string[]
    signature?: string
  }
}

type FormValues = {
  feed: {
    formIndex: number
    id: string
    oldValue: number
    value: number | ''
    isin: string
    quantity: number
    currentPrice: number
    withLinearPricing: boolean
  }[]
}
type Row = FormValues['feed'][0] | ActiveLoan | CreatedLoan

const MAX_COLLECT = 100 // maximum number of transactions to collect in one batch

export function NavManagementAssetTable({ poolId }: { poolId: string }) {
  const { data: domains } = useActiveDomains(poolId)
  const allowedPools = usePoolsForWhichAccountIsFeeder()
  const isFeeder = !!allowedPools?.find((p) => p.id === poolId)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isConfirming, setIsConfirming] = React.useState(false)
  const orders = usePoolAccountOrders(poolId)
  const [liquidityAdminAccount] = useSuitableAccounts({ poolId, poolRole: ['LiquidityAdmin'] })
  const pool = usePool(poolId)
  const [allLoans] = useCentrifugeQuery(['loans', poolId], (cent) => cent.pools.getLoans([poolId]), {
    enabled: !!poolId && !!pool,
  })
  const provider = useEvmProvider()
  const { substrate } = useWallet()
  const poolFees = usePoolFees(poolId)

  const externalLoans = React.useMemo(
    () =>
      (allLoans?.filter(
        // Keep external loans, except ones that are fully repaid
        (l) => isExternalLoan(l) && l.status !== 'Closed' && (!('presentValue' in l) || !l.presentValue.isZero())
      ) as ExternalLoan[]) ?? [],
    [allLoans]
  )

  const cashLoans =
    (allLoans?.filter((l) => isCashLoan(l) && l.status !== 'Closed') as (CreatedLoan | ActiveLoan)[]) ?? []
  const api = useCentrifugeApi()

  const reserveRow = [
    {
      id: 'reserve',
      isin: 'Onchain reserve',
      quantity: 1,
      currentPrice: 0,
      value: pool.reserve.total.toFloat(),
      formIndex: -1,
      oldValue: '',
    },
  ]

  const { ordersFullyExecutable } = useLiquidity(poolId)

  const { execute, isLoading } = useCentrifugeTransaction(
    'Update NAV',
    (cent) => (args: [values: FormValues], options) => {
      const attestation: Attestation = {
        portfolio: {
          decimals: pool.currency.decimals,
          assets: externalLoans.map((l) => ({
            asset: l.id,
            quantity: l.pricing.outstandingQuantity.toString(),
            price: (l as ActiveLoan).currentPrice?.toString() ?? '0',
          })),
          netAssetValue: pool.nav.total.toString(),
          netFeeValue: pool.nav.fees.toString(),
          tokenSupply: pool.tranches.map((t) => t.totalIssuance.toString()),
          tokenPrice: pool.tranches.map((t) => t.tokenPrice?.toString() ?? '0'),
        },
      }

      let $signMessage: Observable<string | null> = of(null)
      if (provider) {
        $signMessage = from(provider.getSigner()).pipe(
          switchMap((signer) => from(signer.signMessage(JSON.stringify(attestation)))),
          catchError((error) => {
            console.error('EVM signing failed:', error)
            return of(null)
          })
        )
      } else if (substrate?.selectedAccount?.address && substrate?.selectedWallet?.signer?.signRaw) {
        $signMessage = from(
          substrate.selectedWallet.signer.signRaw({
            address: substrate.selectedAccount.address,
            data: stringToHex(JSON.stringify(attestation)),
            type: 'bytes',
          })
        ).pipe(
          map(({ signature }) => signature),
          catchError((error) => {
            console.error('Substrate signing failed:', error)
            return of(null)
          })
        )
      }

      const $attestationHash = $signMessage.pipe(
        switchMap((signature) => {
          if (signature) {
            attestation.portfolio.signature = signature
            return cent.metadata.pinJson(attestation)
          } else {
            console.warn('No signature available')
            return of(null)
          }
        }),
        map((result) => (result ? result.ipfsHash : null))
      )

      const deployedDomains = domains?.filter((domain) => domain.hasDeployedLp)
      const updateTokenPrices = deployedDomains
        ? deployedDomains.flatMap((domain) =>
            Object.entries(domain.liquidityPools).flatMap(([tid, poolsByCurrency]) => {
              return domain.currencies
                .filter((cur) => !!poolsByCurrency[cur.address])
                .map((cur) => [tid, cur.key] satisfies [string, CurrencyKey])
                .map(([tid, curKey]) =>
                  cent.liquidityPools.updateTokenPrice([poolId, tid, curKey, domain.chainId], { batch: true })
                )
            })
          )
        : []

      return combineLatest([
        $attestationHash,
        cent.pools.closeEpoch([poolId, false], { batch: true }),
        ...updateTokenPrices,
      ]).pipe(
        switchMap(([attestationHash, closeTx, ...updateTokenPricesTxs]) => {
          if (!attestationHash) {
            throw new Error('Attestation signing failed')
          }
          const [values] = args
          const batch = [
            ...values.feed
              .filter((f) => typeof f.value === 'number' && !Number.isNaN(f.value))
              .map((f) => {
                const feed = f.isin ? { Isin: f.isin } : { poolloanid: [poolId, f.id] }
                return api.tx.oraclePriceFeed.feed(feed, CurrencyBalance.fromFloat(f.value, 18))
              }),
            api.tx.oraclePriceCollection.updateCollection(poolId),
            api.tx.remarks.remark([{ Named: attestationHash }], api.tx.loans.updatePortfolioValuation(poolId)),
            api.tx.utility.batch(updateTokenPricesTxs),
          ]

          if (liquidityAdminAccount && orders?.length) {
            batch.push(
              ...closeTx.method.args[0],
              ...orders
                .slice(0, ordersFullyExecutable ? MAX_COLLECT : 0)
                .map((order) =>
                  api.tx.investments[order.type === 'invest' ? 'collectInvestmentsFor' : 'collectRedemptionsFor'](
                    order.accountId,
                    [poolId, order.trancheId]
                  )
                )
            )
          }

          const tx = api.tx.utility.batchAll(batch)
          return cent.wrapSignAndSend(api, tx, options)
        })
      )
    },
    {
      onSuccess: () => {
        setIsEditing(false)
      },
    }
  )

  const initialValues = React.useMemo(
    () => ({
      feed:
        externalLoans?.map((l, i) => {
          let latestOraclePrice = l.pricing.oracle[0]
          l.pricing.oracle.forEach((price) => {
            if (price.timestamp > latestOraclePrice.timestamp) {
              latestOraclePrice = price
            }
          })
          return {
            formIndex: i,
            id: l.id,
            oldValue: latestOraclePrice.value.toFloat(),
            value: l.status === 'Active' ? l?.currentPrice.toDecimal().toNumber() : 0,
            isin: 'isin' in l.pricing.priceId ? l.pricing.priceId.isin : '',
            quantity: l.pricing.outstandingQuantity.toFloat(),
            withLinearPricing: l.pricing.withLinearPricing,
            currentPrice: l.status === 'Active' ? l?.currentPrice.toDecimal().toNumber() : 0,
          }
        }) ?? [],
    }),
    [externalLoans]
  )

  const form = useFormik<FormValues>({
    initialValues,
    onSubmit(values, actions) {
      execute([values])
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing, isLoading])

  // NOTE: This assumes that pool.reserve.total comes from onchain state AND NOT from the runtime-apis
  const totalAum = pool.nav.aum.toDecimal().add(pool.reserve.total.toDecimal())

  // NOTE: current pending here in the app does include both pending + disbursed fees
  const pendingFees = React.useMemo(() => {
    return new CurrencyBalance(
      poolFees?.map((f) => f.amounts.pending).reduce((acc, f) => acc.add(f), new BN(0)) ?? new BN(0),
      pool.currency.decimals
    )
  }, [poolFees, pool.currency.decimals])

  const changeInValuation = React.useMemo(() => {
    return (externalLoans as ActiveLoan[]).reduce((prev, curr) => {
      const price = curr.currentPrice ? curr.currentPrice.toDecimal() : Dec(0)
      const quantity = (curr as ExternalLoan).pricing.outstandingQuantity.toDecimal()
      const updatedPrice = Dec(form.values.feed.find((p) => p.id === curr.id)?.value || 0)
      return CurrencyBalance.fromFloat(
        prev.toDecimal().add(updatedPrice.sub(price).mul(quantity)).toString(),
        pool.currency.decimals
      )
    }, new CurrencyBalance(0, pool.currency.decimals))
  }, [externalLoans, form.values.feed, pool.currency.decimals])

  const pendingNav = totalAum.add(changeInValuation.toDecimal()).sub(pendingFees.toDecimal())

  // Only for single tranche pools
  const newPrice = pendingNav.toNumber() / pool.tranches[0].totalIssuance.toFloat()
  const isTinlakePool = poolId.startsWith('0x')

  const columns = [
    {
      align: 'left',
      header: 'Asset',
      cell: (row: Row) =>
        'oldValue' in row ? (
          <Shelf gap={1} height={40}>
            {row.id === 'reserve' ? (
              <Shelf height="24px" width="24px" alignItems="center" justifyContent="center">
                <Box as="img" src={isTinlakePool ? daiLogo : usdcLogo} alt="" height="13px" width="13px" />
              </Shelf>
            ) : (
              <Thumbnail type="asset" label={row.id} />
            )}
            <Text variant="body2" fontWeight={600}>
              <RouterTextLink
                to={row.id !== 'reserve' ? `/issuer/${pool.id}/assets/${row.id}` : `/nav-management/${pool.id}`}
                target="_blank"
              >
                {row.isin || row.id}
              </RouterTextLink>
            </Text>
          </Shelf>
        ) : (
          <Shelf height={40}>
            <AssetName loan={row} />
          </Shelf>
        ),
    },
    {
      align: 'left',
      header: 'Linear pricing',
      width: '100px',
      cell: (row: Row) => (row.id === 'reserve' ? '' : 'oldValue' in row && row.withLinearPricing ? 'Yes' : 'No'),
    },
    {
      align: 'right',
      header: 'Quantity',
      cell: (row: Row) =>
        row.id !== 'reserve' ? formatBalance('oldValue' in row ? row.quantity : row.outstandingDebt) : '',
    },
    {
      align: 'right',
      header: 'Asset price',
      cell: (row: Row) =>
        row.id !== 'reserve'
          ? formatBalance(
              'currentPrice' in row && typeof row.currentPrice === 'number' ? row.currentPrice : 0,
              pool.currency.displayName,
              8
            )
          : '',
    },
    {
      align: 'right',
      header: 'New price',
      cell: (row: Row) => {
        return 'oldValue' in row && row.id !== 'reserve' && isEditing ? (
          <Field name={`feed.${row.formIndex}.value`} validate={nonNegativeNumber()}>
            {({ field, meta, form }: FieldProps) => (
              <CurrencyInput
                {...field}
                placeholder={row.oldValue.toString()}
                errorMessage={meta.touched ? meta.error : undefined}
                currency={pool.currency.displayName}
                onChange={(value) => form.setFieldValue(`feed.${row.formIndex}.value`, value)}
                value={field.value}
              />
            )}
          </Field>
        ) : (
          ''
        )
      },
    },
    {
      align: 'right',
      header: 'Value',
      cell: (row: Row) => {
        if (row.id === 'reserve' && 'value' in row) return formatBalance(row.value || 0, pool.currency.symbol)
        const newValue =
          'value' in row && !Number.isNaN(row.value) && typeof row.value === 'number' && isEditing
            ? row.value
            : undefined
        return 'oldValue' in row
          ? formatBalance(row.quantity * (newValue ?? row.oldValue), pool.currency.symbol)
          : formatBalance(row.outstandingDebt, pool.currency.symbol)
      },
    },
  ]

  if (!isEditing) {
    columns.splice(5, 1)
  }

  return (
    <>
      <LayoutSection pt={3}>
        <NavOverviewCard
          poolId={pool.id}
          changeInValuation={changeInValuation.toDecimal().toNumber()}
          totalAum={totalAum.toNumber()}
          pendingFees={pendingFees.toDecimal().toNumber()}
          pendingNav={pendingNav.toNumber()}
        />
      </LayoutSection>

      <Stack pb={8}>
        <FormikProvider value={form}>
          <Drawer isOpen={isConfirming} onClose={() => setIsConfirming(false)}>
            <Stack gap={2}>
              <Stack gap={2}>
                <Text variant="heading3">Confirm NAV</Text>
                <VisualNavCard
                  currency={pool.currency}
                  aum={totalAum.toNumber()}
                  change={changeInValuation.toDecimal().toNumber()}
                  pendingFees={pendingFees.toFloat()}
                  pendingNav={pendingNav.toNumber()}
                />
              </Stack>
              {pool.tranches.length === 1 && (
                <Stack gap={2}>
                  <Text variant="heading3">Token price update</Text>
                  <Shelf bg="backgroundSecondary" p={1} gap={1}>
                    <Text variant="body2">
                      {pool.tranches[0].currency.symbol} price:{' '}
                      {formatBalance(pool.tranches[0].tokenPrice ?? 0, pool.currency.symbol, 5)}
                    </Text>
                    <IconArrowRight size={16} />{' '}
                    <Text variant="body2" color="accentPrimary">
                      {pool.tranches[0].currency.symbol} price: {formatBalance(newPrice ?? 0, pool.currency.symbol, 5)}
                    </Text>
                  </Shelf>
                </Stack>
              )}
              <ButtonGroup>
                <Button
                  onClick={() => {
                    form.submitForm()
                    setIsConfirming(false)
                  }}
                >
                  Update NAV
                </Button>
                <Button variant="secondary" onClick={() => setIsConfirming(false)}>
                  Cancel
                </Button>
              </ButtonGroup>

              {liquidityAdminAccount && orders?.length ? (
                <Text variant="body3">
                  There are open investment or redemption orders, updating the NAV will trigger the execution of orders.
                </Text>
              ) : null}
            </Stack>
          </Drawer>
          <LayoutSection
            title="Assets"
            pt={5}
            headerRight={
              isEditing ? (
                <ButtonGroup variant="small" key="editing">
                  <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                    Cancel
                  </Button>
                  <Button
                    small
                    onClick={() => setIsConfirming(true)}
                    loading={isLoading || form.isSubmitting}
                    loadingMessage={isLoading ? 'Pending...' : undefined}
                    disabled={!isFeeder}
                  >
                    Done
                  </Button>
                </ButtonGroup>
              ) : (
                <ButtonGroup variant="small" key="edit">
                  <Button variant="tertiary" small icon={IconDownload}>
                    Download
                  </Button>
                  <Button onClick={() => setIsEditing(true)} small>
                    Edit
                  </Button>
                </ButtonGroup>
              )
            }
          >
            <DataTable data={[...reserveRow, ...cashLoans, ...form.values.feed]} columns={columns} />
          </LayoutSection>
        </FormikProvider>
      </Stack>
    </>
  )
}

export function NavOverviewCard({
  poolId,
  changeInValuation,
  totalAum,
  pendingFees,
  pendingNav,
}: {
  poolId: string
  changeInValuation: number
  totalAum: number
  pendingFees: number
  pendingNav: number
}) {
  const pool = usePool(poolId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <VisualNavCard
      currency={pool.currency}
      aum={totalAum ?? 0}
      change={changeInValuation ?? 0}
      pendingFees={pendingFees ?? 0}
      pendingNav={pendingNav ?? 0}
    />
  )
}

export function VisualNavCard({
  currency,
  aum,
  change,
  pendingFees,
  pendingNav,
}: {
  currency: Pick<CurrencyMetadata, 'displayName' | 'decimals'>
  aum: number
  change: number
  pendingFees: number
  pendingNav: number
}) {
  return (
    <Stack p={2} maxWidth="444px" bg="backgroundTertiary" gap={2}>
      <Shelf justifyContent="space-between">
        <Text variant="body2" color="textPrimary">
          AUM
        </Text>
        <Text variant="body2">{formatBalance(aum, currency.displayName, 2)}</Text>
      </Shelf>
      <Divider borderColor="statusInfoBg" />
      <Stack gap={1}>
        <Shelf justifyContent="space-between">
          <Text variant="body2" color="textPrimary">
            Change in asset valuation
          </Text>
          <Text variant="body2" color={change >= 0 ? 'statusOk' : 'statusCritical'}>
            {formatBalance(change, currency.displayName, 2)}
          </Text>
        </Shelf>
        <Shelf justifyContent="space-between">
          <Text variant="body2" color="textPrimary">
            Pending fees
          </Text>
          <Text variant="body2" color="statusCritical">
            -{formatBalance(pendingFees, currency.displayName, 2)}
          </Text>
        </Shelf>
      </Stack>
      <Divider borderColor="statusInfoBg" />
      <Shelf justifyContent="space-between">
        <Shelf gap={1}>
          <IconClockForward color="textSelected" size="iconSmall" />
          <Text variant="body2" color="textSelected">
            Pending NAV
          </Text>
        </Shelf>
        <Text variant="body2" color="textSelected">
          {formatBalance(pendingNav, currency.displayName, 2)}
        </Text>
      </Shelf>
    </Stack>
  )
}
