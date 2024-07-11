import { Loan as LoanType, Pool, PricingInfo, TinlakeLoan } from '@centrifuge/centrifuge-js'
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
  Thumbnail,
  truncate,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useParams, useRouteMatch } from 'react-router'
import styled, { useTheme } from 'styled-components'
import usdcLogo from '../../assets/images/usdc-logo.svg'
import { AssetSummary } from '../../components/AssetSummary'
import AssetPerformanceChart from '../../components/Charts/AssetPerformanceChart'
import { LabelValueStack } from '../../components/LabelValueStack'
import { LayoutBase } from '../../components/LayoutBase'
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
import { useLoan } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useCanBorrowAsset } from '../../utils/usePermissions'
import { useBorrowerAssetTransactions, usePool, usePoolMetadata } from '../../utils/usePools'
import { FinanceForm } from './FinanceForm'
import { HoldingsValues } from './HoldingsValues'
import { KeyMetrics } from './KeyMetrics'
import { MetricsTable } from './MetricsTable'
import { PricingValues } from './PricingValues'
import { RepayForm } from './RepayForm'
import { TransactionTable } from './TransactionTable'
import { formatNftAttribute } from './utils'

const FullHeightLayoutBase = styled(LayoutBase)`
  height: 100vh;
  display: flex;
  flex-direction: column;
`

const FullHeightStack = styled(Stack)`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
`

export default function LoanPage() {
  return (
    <FullHeightLayoutBase>
      <FullHeightStack>
        <Loan />
      </FullHeightStack>
    </FullHeightLayoutBase>
  )
}
function isTinlakeLoan(loan: LoanType | TinlakeLoan): loan is TinlakeLoan {
  return loan.poolId.startsWith('0x')
}

function LoanDrawerContent({ loan }: { loan: LoanType }) {
  const canBorrow = useCanBorrowAsset(loan.poolId, loan.id)

  if (!loan || loan.status === 'Closed' || !canBorrow || isTinlakeLoan(loan)) return null

  return (
    <Stack gap={2}>
      <FinanceForm loan={loan} />
      {loan.status === 'Active' && <RepayForm loan={loan} />}
    </Stack>
  )
}

function FinanceButton({ loan }: { loan: LoanType }) {
  const canBorrow = useCanBorrowAsset(loan.poolId, loan.id)
  const [financeShown, setFinanceShown] = React.useState(false)
  if (!canBorrow || loan.status === 'Closed') return null
  return (
    <>
      <Drawer isOpen={financeShown} onClose={() => setFinanceShown(false)}>
        <LoadBoundary>
          <LoanDrawerContent loan={loan} />
        </LoadBoundary>
      </Drawer>

      <Button onClick={() => setFinanceShown(true)} small>
        Finance
      </Button>
    </>
  )
}

function Loan() {
  const theme = useTheme()
  const { pid: poolId, aid: loanId } = useParams<{ pid: string; aid: string }>()
  const isTinlakePool = poolId.startsWith('0x')
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''
  const pool = usePool(poolId)
  const loan = useLoan(poolId, loanId)
  const { data: poolMetadata, isLoading: poolMetadataIsLoading } = usePoolMetadata(pool)
  const nft = useCentNFT(loan?.asset.collectionId, loan?.asset.nftId, false)
  const { data: nftMetadata, isLoading: nftMetadataIsLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const metadataIsLoading = poolMetadataIsLoading || nftMetadataIsLoading
  const borrowerAssetTransactions = useBorrowerAssetTransactions(poolId, loanId)

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
        icon={
          loanId === '0' ? (
            <Box as="img" src={usdcLogo} alt="" height="iconMedium" width="iconMedium" />
          ) : (
            <Thumbnail type="asset" label={loan?.id ?? ''} size="large" />
          )
        }
        title={
          <Shelf>
            <Box mr="16px">
              <TextWithPlaceholder isLoading={metadataIsLoading}>{name}</TextWithPlaceholder>
            </Box>
            {loan && <LoanLabel loan={loan} />}
          </Shelf>
        }
        subtitle={loan && !isTinlakeLoan(loan) && <FinanceButton loan={loan} />}
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
                      maturityDate={new Date(loan.pricing.maturityDate)}
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
            <LabelValueStack label={<Tooltips variant="secondary" type="id" />} value={loanId} />
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
