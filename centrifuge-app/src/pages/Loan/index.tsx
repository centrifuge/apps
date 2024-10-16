import { ActiveLoan, Loan as LoanType, Pool, PricingInfo, TinlakeLoan } from '@centrifuge/centrifuge-js'
import {
  Box,
  Button,
  Card,
  Drawer,
  Grid,
  IconChevronLeft,
  Shelf,
  Spinner,
  Stack,
  Text,
  TextWithPlaceholder,
  truncate,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import styled, { useTheme } from 'styled-components'
import { AssetSummary } from '../../components/AssetSummary'
import AssetPerformanceChart from '../../components/Charts/AssetPerformanceChart'
import { LabelValueStack } from '../../components/LabelValueStack'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { LoadBoundary } from '../../components/LoadBoundary'
import { LoanLabel } from '../../components/LoanLabel'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { TransactionHistoryTable } from '../../components/PoolOverview/TransactionHistory'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { Tooltips } from '../../components/Tooltips'
import { nftMetadataSchema } from '../../schemas'
import { LoanTemplate } from '../../types'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { formatBalance, truncateText } from '../../utils/formatting'
import { useBasePath } from '../../utils/useBasePath'
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

const FullHeightStack = styled(Stack)`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
`

export default function LoanPage() {
  return <Loan />
}
function isTinlakeLoan(loan: LoanType | TinlakeLoan): loan is TinlakeLoan {
  return loan.poolId.startsWith('0x')
}

function ActionButtons({ loan }: { loan: LoanType }) {
  const canBorrow = useCanBorrowAsset(loan.poolId, loan.id)
  const [financeShown, setFinanceShown] = React.useState(false)
  const [repayShown, setRepayShown] = React.useState(false)
  const [correctionShown, setCorrectionShown] = React.useState(false)
  if (!loan || !canBorrow || isTinlakeLoan(loan) || !canBorrow || loan.status === 'Closed') return null
  return (
    <>
      <Drawer isOpen={financeShown} onClose={() => setFinanceShown(false)} innerPaddingTop={2}>
        <LoadBoundary>
          <FinanceForm loan={loan} />
        </LoadBoundary>
      </Drawer>
      <Drawer isOpen={repayShown} onClose={() => setRepayShown(false)} innerPaddingTop={2}>
        <LoadBoundary>
          <Stack gap={2}>
            <RepayForm loan={loan} />
          </Stack>
        </LoadBoundary>
      </Drawer>
      <Drawer isOpen={correctionShown} onClose={() => setCorrectionShown(false)} innerPaddingTop={2}>
        <LoadBoundary>
          <Stack gap={2}>
            <CorrectionForm loan={loan as ActiveLoan} />
          </Stack>
        </LoadBoundary>
      </Drawer>

      <Shelf gap={2}>
        {!(loan.pricing.maturityDate && new Date() > new Date(loan.pricing.maturityDate)) ||
        !loan.pricing.maturityDate ? (
          <Button onClick={() => setFinanceShown(true)} small>
            {isCashLoan(loan) ? 'Deposit' : isExternalLoan(loan) ? 'Purchase' : 'Finance'}
          </Button>
        ) : null}
        {loan.outstandingDebt.gtn(0) && (
          <Button onClick={() => setRepayShown(true)} small>
            {isCashLoan(loan) ? 'Withdraw' : isExternalLoan(loan) ? 'Sell' : 'Repay'}
          </Button>
        )}
        {loan.outstandingDebt.gtn(0) && (
          <Button onClick={() => setCorrectionShown(true)} small>
            Correction
          </Button>
        )}
      </Shelf>
    </>
  )
}

function Loan() {
  const theme = useTheme()
  const { pid: poolId, aid: loanId } = useParams<{ pid: string; aid: string }>()
  if (!poolId || !loanId) throw new Error('Loan no found')
  const basePath = useBasePath()
  const isTinlakePool = poolId?.startsWith('0x')
  const pool = usePool(poolId)
  const loan = useLoan(poolId, loanId)
  const { data: poolMetadata, isLoading: poolMetadataIsLoading } = usePoolMetadata(pool)
  const nft = useCentNFT(loan?.asset.collectionId, loan?.asset.nftId, false)
  const { data: nftMetadata, isLoading: nftMetadataIsLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const metadataIsLoading = poolMetadataIsLoading || nftMetadataIsLoading
  const borrowerAssetTransactions = useBorrowerAssetTransactions(`${poolId}`, `${loanId}`)

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

  return (
    <FullHeightStack>
      <Box mt={2} ml={2}>
        <RouterLinkButton to={`${basePath}/${poolId}/assets`} small icon={IconChevronLeft} variant="tertiary">
          {poolMetadata?.pool?.name ?? 'Pool assets'}
        </RouterLinkButton>
      </Box>
      <PageHeader
        title={
          <Shelf>
            <Box mr="16px" ml={2}>
              <TextWithPlaceholder isLoading={metadataIsLoading}>{name}</TextWithPlaceholder>
            </Box>
            {loan && <LoanLabel loan={loan} />}
          </Shelf>
        }
        subtitle={loan && !isTinlakeLoan(loan) && <ActionButtons loan={loan} />}
      />
      {loanId === '0' && (
        <>
          <AssetSummary
            data={[
              {
                label: 'Current value',
                value: `${formatBalance(pool.reserve.total, pool.currency.symbol, 2, 2)}`,
              },
            ]}
          />
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
        <LayoutSection bg={theme.colors.backgroundSecondary} pt={2} pb={4} flex={1}>
          <Grid height="fit-content" gridTemplateColumns={['1fr', '66fr 34fr']} gap={[2, 2]}>
            <React.Suspense fallback={<Spinner />}>
              <AssetPerformanceChart pool={pool} poolId={poolId} loanId={loanId} />
            </React.Suspense>
            {'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle' && (
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
            {'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle' && (
              <React.Suspense fallback={<Spinner />}>
                <HoldingsValues
                  pool={pool as Pool}
                  transactions={borrowerAssetTransactions}
                  currentFace={currentFace}
                  pricing={loan.pricing}
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
                      <Text fontSize="18px" fontWeight="500">
                        {section.name}
                      </Text>
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
              <Card p={3}>
                <TransactionHistoryTable
                  transactions={borrowerAssetTransactions ?? []}
                  poolId={poolId}
                  preview={false}
                  activeAssetId={loanId}
                />
              </Card>
            ) : (
              <Grid height="fit-content" gridTemplateColumns={['1fr']} gap={[2, 2, 3]}>
                <Card p={3}>
                  <Stack gap={2}>
                    <Text fontSize="18px" fontWeight="500">
                      Transaction history
                    </Text>

                    <TransactionTable
                      transactions={borrowerAssetTransactions}
                      currency={pool.currency.symbol}
                      loanType={
                        'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle'
                          ? 'external'
                          : 'internal'
                      }
                      poolType={poolMetadata?.pool?.asset.class}
                      decimals={pool.currency.decimals}
                      pricing={loan.pricing as PricingInfo}
                      maturityDate={loan.pricing.maturityDate ? new Date(loan.pricing.maturityDate) : undefined}
                      originationDate={originationDate ? new Date(originationDate) : undefined}
                    />
                  </Stack>
                </Card>
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
    </FullHeightStack>
  )
}
