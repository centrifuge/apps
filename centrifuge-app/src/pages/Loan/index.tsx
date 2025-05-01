import {
  ActiveLoan,
  AssetTransaction,
  ExternalPricingInfo,
  Loan as LoanType,
  Pool,
  PricingInfo,
  TinlakeLoan,
} from '@centrifuge/centrifuge-js'
import { BackButton, Box, Button, Card, Drawer, Grid, Shelf, Spinner, Stack, Text, truncate } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { AssetSummary } from '../../../src/components/AssetSummary'
import { SimpleLineChart } from '../../../src/components/Charts/SimpleLineChart'
import { LoanLabel } from '../../../src/components/LoanLabel'
import { RouterLinkButton } from '../../../src/components/RouterLinkButton'
import AssetPerformanceChart from '../../components/Charts/AssetPerformanceChart'
import { LabelValueStack } from '../../components/LabelValueStack'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { LoadBoundary } from '../../components/LoadBoundary'
import { PageSection } from '../../components/PageSection'
import { TransactionHistoryTable } from '../../components/PoolOverview/TransactionHistory'
import { Tooltips } from '../../components/Tooltips'
import { nftMetadataSchema } from '../../schemas'
import { LoanTemplate } from '../../types'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { formatBalance, truncateText } from '../../utils/formatting'
import { useLoan } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useCanBorrowAsset } from '../../utils/usePermissions'
import { useBorrowerAssetTransactions, usePool, usePoolMetadata } from '../../utils/usePools'
import { CorrectionForm } from './CorrectionForm'
import { FinanceForm } from './FinanceForm'
import { HoldingsValues } from './HoldingsValues'
import { KeyMetrics } from './KeyMetrics'
import { MetricsTable } from './MetricsTable'
import { PricingValues } from './PricingValues'
import { RepayForm } from './RepayForm'
import { TransactionTable } from './TransactionTable'
import { formatNftAttribute, isCashLoan, isExternalLoan } from './utils'

export default function LoanPage() {
  return <Loan />
}
function isTinlakeLoan(loan: LoanType | TinlakeLoan): loan is TinlakeLoan {
  return loan.poolId.startsWith('0x')
}

const positiveNetflows = ['DEPOSIT_FROM_INVESTMENTS', 'INCREASE_DEBT']

function ActionButtons({ loan }: { loan: LoanType }) {
  const canBorrow = useCanBorrowAsset(loan.poolId, loan.id)
  const [financeShown, setFinanceShown] = React.useState(false)
  const [repayShown, setRepayShown] = React.useState(false)
  const [correctionShown, setCorrectionShown] = React.useState(false)
  if (!loan || !canBorrow || isTinlakeLoan(loan) || !canBorrow || loan.status === 'Closed') return null
  return (
    <Box marginLeft="auto">
      <Drawer
        isOpen={financeShown}
        onClose={() => setFinanceShown(false)}
        title={isExternalLoan(loan) ? 'Purchase' : isCashLoan(loan) ? 'Deposit' : 'Finance'}
      >
        <LoadBoundary>
          <FinanceForm loan={loan} />
        </LoadBoundary>
      </Drawer>
      <Drawer
        isOpen={repayShown}
        onClose={() => setRepayShown(false)}
        title={isExternalLoan(loan) ? 'Sell' : isCashLoan(loan) ? 'Withdraw' : 'Repay'}
      >
        <LoadBoundary>
          <RepayForm loan={loan} />
        </LoadBoundary>
      </Drawer>
      <Drawer isOpen={correctionShown} onClose={() => setCorrectionShown(false)} title="Correction">
        <LoadBoundary>
          <CorrectionForm loan={loan as ActiveLoan} />
        </LoadBoundary>
      </Drawer>

      <Shelf gap={2}>
        {!(loan.pricing.maturityDate && new Date() > new Date(loan.pricing.maturityDate)) ||
        !loan.pricing.maturityDate ? (
          <Button onClick={() => setFinanceShown(true)} small variant="secondary">
            {isCashLoan(loan) ? 'Deposit' : isExternalLoan(loan) ? 'Purchase' : 'Finance'}
          </Button>
        ) : null}
        {loan.outstandingDebt.gtn(0) && (
          <Button onClick={() => setRepayShown(true)} small variant="secondary">
            {isCashLoan(loan) ? 'Withdraw' : isExternalLoan(loan) ? 'Sell' : 'Repay'}
          </Button>
        )}
        {loan.outstandingDebt.gtn(0) && (
          <Button onClick={() => setCorrectionShown(true)} small variant="inverted">
            Correction
          </Button>
        )}
      </Shelf>
    </Box>
  )
}

function Loan() {
  const { pid: poolId, aid: loanId } = useParams<{ pid: string; aid: string }>()
  if (!poolId || !loanId) throw new Error('Loan no found')
  const isTinlakePool = poolId?.startsWith('0x')
  const pool = usePool(poolId)
  const loan = useLoan(poolId, loanId)
  const { data: poolMetadata, isLoading: poolMetadataIsLoading } = usePoolMetadata(pool)
  const nft = useCentNFT(loan?.asset.collectionId, loan?.asset.nftId, false)
  const { data: nftMetadata, isLoading: nftMetadataIsLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const metadataIsLoading = poolMetadataIsLoading || nftMetadataIsLoading
  const borrowerAssetTransactions = useBorrowerAssetTransactions(`${poolId}`, `${loanId}`)
  const isOracle = loan && 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle'

  const getNetflow = (value: Number, type: string) => {
    if (positiveNetflows.includes(type)) return value
    else return -value
  }

  const onchainReserveChart = React.useMemo(() => {
    return borrowerAssetTransactions?.map((transaction) => {
      return {
        name: transaction.timestamp.toString(),
        yAxis: getNetflow(transaction.amount?.toNumber() ?? 0, transaction.type),
      }
    })
  }, [borrowerAssetTransactions])

  const currentFace =
    loan?.pricing && 'outstandingQuantity' in loan.pricing
      ? loan.pricing.outstandingQuantity.toDecimal().mul(loan.pricing.notional.toDecimal())
      : null

  const templateIds = poolMetadata?.loanTemplates?.map((s) => s.id) ?? []
  const templateId = templateIds.at(-1)
  const { data: templateMetadata } = useMetadata<LoanTemplate>(templateId)

  const name = truncateText(
    (isTinlakePool ? loan?.asset.nftId : loanId === '0' ? 'Onchain reserve' : nftMetadata?.name) || 'Unnamed asset',
    30
  )

  const { data: templateData } = useMetadata<LoanTemplate>(
    nftMetadata?.properties?._template && `ipfs://${nftMetadata?.properties?._template}`
  )

  const publicData = nftMetadata?.properties
    ? Object.fromEntries(Object.entries(nftMetadata.properties).map(([key, obj]: any) => [key, obj]))
    : {}

  const originationDate = loan && 'originationDate' in loan ? new Date(loan?.originationDate).toISOString() : undefined

  const getCurrentValue = () => {
    if (loanId === '0') return pool.reserve.total
    if (loan && 'presentValue' in loan) return loan.presentValue
    return 0
  }

  const getCurrentPrice = () => {
    if (loan && 'currentPrice' in loan) return loan.currentPrice
    return 0
  }

  if (metadataIsLoading) return

  return (
    <Stack>
      <Box mt={2} mb={2}>
        <BackButton label={name} as={RouterLinkButton} goBack>
          {loan && <LoanLabel loan={loan} />}
        </BackButton>
      </Box>

      <AssetSummary
        data={
          isOracle
            ? [
                {
                  label: `Asset Value (${pool.currency.symbol ?? 'USD'})`,
                  value: `${formatBalance(getCurrentValue(), undefined, 2, 2)}`,
                  heading: true,
                },
                {
                  label: `Price (${pool.currency.symbol ?? 'USD'})`,
                  value: `${formatBalance(getCurrentPrice(), undefined, 2, 2)}`,
                  heading: false,
                },
              ]
            : [
                {
                  label: `Current value (USD)`,
                  value: `${formatBalance(getCurrentValue(), undefined, 2, 2)}`,
                  heading: true,
                },
              ]
        }
      >
        {loan && !isTinlakeLoan(loan) && <ActionButtons loan={loan} />}
      </AssetSummary>

      {loanId === '0' && (
        <>
          <PageSection>
            <Box mt={2}>
              <SimpleLineChart data={onchainReserveChart ?? []} currency={pool.currency} />
            </Box>
          </PageSection>
          <PageSection>
            <TransactionHistoryTable
              transactions={borrowerAssetTransactions ?? []}
              poolId={poolId}
              preview={false}
              activeAssetId={loanId}
            />
          </PageSection>
        </>
      )}
      {loan && pool && (
        <LayoutSection pt={2} pb={4} flex={1}>
          <Grid height="fit-content" gridTemplateColumns={isOracle ? ['1fr', '67fr 34fr'] : ['1fr']} gap={[2, 2]}>
            <React.Suspense fallback={<Spinner />}>
              <AssetPerformanceChart pool={pool} poolId={poolId} loanId={loanId} />
            </React.Suspense>
            {isOracle && (
              <React.Suspense fallback={<Spinner />}>
                <KeyMetrics pool={pool} loan={loan} />
              </React.Suspense>
            )}
          </Grid>

          <Grid
            height="fit-content"
            gridTemplateColumns={['1fr', '33fr 33fr 34fr']}
            gridAutoRows="minContent"
            gap={[2, 2, 2]}
          >
            {isOracle && (
              <React.Suspense fallback={<Spinner />}>
                <HoldingsValues
                  pool={pool as Pool}
                  transactions={borrowerAssetTransactions as AssetTransaction[] | null | undefined}
                  currentFace={currentFace}
                  pricing={loan.pricing as ExternalPricingInfo}
                />
              </React.Suspense>
            )}

            {'valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash' && (
              <React.Suspense fallback={<Spinner />}>
                <PricingValues loan={loan} pool={pool} />
              </React.Suspense>
            )}

            {templateData?.sections?.map((section, i) => {
              const isPublic = section.attributes.every((key) => templateData.attributes?.[key]?.public)
              if (!isPublic) return null
              return (
                <React.Suspense fallback={<Spinner />}>
                  <Card p={3}>
                    <Stack gap={2}>
                      <Text variant="heading4">{section.name}</Text>
                      <MetricsTable
                        metrics={section.attributes
                          .filter(
                            (key) =>
                              !!templateData.attributes?.[key] &&
                              (!templateMetadata?.keyAttributes ||
                                !Object.values(templateMetadata?.keyAttributes).includes(key))
                          )
                          .map((key) => {
                            const attribute = templateData.attributes?.[key]!
                            const value = publicData[key]
                            const formatted = value ? formatNftAttribute(value, attribute) : '-'
                            return {
                              label: attribute.label,
                              value: formatted,
                            }
                          })}
                      />
                    </Stack>
                  </Card>
                </React.Suspense>
              )
            })}
          </Grid>

          {borrowerAssetTransactions?.length ? (
            'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'cash' ? (
              <TransactionHistoryTable
                transactions={borrowerAssetTransactions ?? []}
                poolId={poolId}
                preview={false}
                activeAssetId={loanId}
              />
            ) : (
              <Grid height="fit-content" gridTemplateColumns={['1fr']} gap={[2, 2, 3]}>
                <Stack gap={2}>
                  <Text variant="heading4">Transaction history</Text>
                  <TransactionTable
                    transactions={borrowerAssetTransactions}
                    currency={pool.currency.symbol}
                    loanType={isOracle ? 'external' : 'internal'}
                    poolType={poolMetadata?.pool?.asset.class}
                    decimals={pool.currency.decimals}
                    pricing={loan.pricing as PricingInfo}
                    maturityDate={loan.pricing.maturityDate ? new Date(loan.pricing.maturityDate) : undefined}
                    originationDate={originationDate ? new Date(originationDate) : undefined}
                  />
                </Stack>
              </Grid>
            )
          ) : null}
        </LayoutSection>
      )}
      {isTinlakePool && loan && 'owner' in loan ? (
        <PageSection title={<Box>NFT</Box>}>
          <Shelf gap={6}>
            <LabelValueStack label={<Tooltips type="id" />} value={loanId} />
            <LabelValueStack
              label="Owner"
              value={
                <Text
                  style={{
                    cursor: 'copy',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                  }}
                  onClick={() => copyToClipboard(loan.owner || '')}
                >
                  {truncate(loan.owner)}
                </Text>
              }
            />
          </Shelf>
        </PageSection>
      ) : null}
    </Stack>
  )
}
