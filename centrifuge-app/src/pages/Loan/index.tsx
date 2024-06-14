import {
  CurrencyBalance,
  ExternalPricingInfo,
  Loan as LoanType,
  Pool,
  PricingInfo,
  TinlakeLoan,
} from '@centrifuge/centrifuge-js'
import {
  AnchorButton,
  Box,
  Button,
  Drawer,
  Flex,
  Grid,
  IconChevronLeft,
  IconDownload,
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
import usdcLogo from '../../assets/images/usdc-logo.svg'
import { AssetSummary } from '../../components/AssetSummary'
import AssetPerformanceChart from '../../components/Charts/AssetPerformanceChart'
import { useDebugFlags } from '../../components/DebugFlags'
import { LabelValueStack } from '../../components/LabelValueStack'
import { LayoutBase } from '../../components/LayoutBase'
import { LoadBoundary } from '../../components/LoadBoundary'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { TransactionHistoryTable } from '../../components/PoolOverview/TransactionHistory'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { Tooltips } from '../../components/Tooltips'
import { nftMetadataSchema } from '../../schemas'
import { LoanTemplate } from '../../types'
import { Dec } from '../../utils/Decimal'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { daysBetween, formatDate, isValidDate } from '../../utils/date'
import { formatBalance, formatPercentage, truncateText } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useLoan } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useCanBorrowAsset } from '../../utils/usePermissions'
import { useAssetSnapshots, useBorrowerAssetTransactions, usePool, usePoolMetadata } from '../../utils/usePools'
import { FinanceForm } from './FinanceForm'
import { FinancingRepayment } from './FinancingRepayment'
import { HoldingsValues } from './HoldingsValues'
import { PricingValues } from './PricingValues'
import { RepayForm } from './RepayForm'
import { TransactionTable } from './TransactionTable'
import { TransferDebtForm } from './TransferDebtForm'
import { formatNftAttribute } from './utils'

export default function LoanPage() {
  return (
    <LayoutBase>
      <Loan />
    </LayoutBase>
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
      <TransferDebtForm loan={loan} />
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

  const { assetSnapshots: showAssetSnapshots } = useDebugFlags()
  const assetSnapshots = useAssetSnapshots(poolId, loanId)

  const dataUrl: any = React.useMemo(() => {
    if (!assetSnapshots || !assetSnapshots?.length) {
      return undefined
    }

    const formatted = assetSnapshots.map((snapshot) => {
      return {
        ...snapshot,
      }
    })

    return getCSVDownloadUrl(formatted as any)
  }, [assetSnapshots, pool.currency.symbol])

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

  const maturityPercentage = React.useMemo(() => {
    if (originationDate && loan?.pricing.maturityDate) {
      const termDays = daysBetween(originationDate, loan?.pricing.maturityDate)
      const daysSinceIssuance = daysBetween(originationDate, new Date())

      if (daysSinceIssuance >= termDays) return 1

      return daysSinceIssuance / termDays
    }
    return 0
  }, [originationDate, loan?.pricing.maturityDate])

  const weightedYTM = React.useMemo(() => {
    if (
      loan?.pricing &&
      'valuationMethod' in loan.pricing &&
      loan.pricing.valuationMethod === 'oracle' &&
      loan.pricing.interestRate.isZero()
    ) {
      return borrowerAssetTransactions
        ?.filter((tx) => tx.type !== 'REPAID')
        .reduce((prev, curr) => {
          const termDays = curr.timestamp
            ? daysBetween(curr.timestamp, loan?.pricing.maturityDate)
            : daysBetween(new Date(), loan?.pricing.maturityDate)

          const faceValue =
            curr.quantity && (loan.pricing as ExternalPricingInfo).notional
              ? new CurrencyBalance(curr.quantity, 18)
                  .toDecimal()
                  .mul((loan.pricing as ExternalPricingInfo).notional.toDecimal())
              : null

          const yieldToMaturity =
            curr.amount && faceValue && termDays > 0
              ? faceValue
                  ?.sub(curr.amount.toDecimal())
                  .div(curr.amount.toDecimal())
                  .mul(Dec(365).div(Dec(termDays)))
                  .mul(100)
              : null
          return yieldToMaturity?.mul(curr.quantity!).add(prev) || prev
        }, Dec(0))
    }
    return null
  }, [loan, borrowerAssetTransactions])

  const averageWeightedYTM = React.useMemo(() => {
    if (borrowerAssetTransactions?.length && weightedYTM) {
      const sum = borrowerAssetTransactions
        .filter((tx) => tx.type !== 'REPAID')
        .reduce((prev, curr) => {
          return curr.quantity ? Dec(curr.quantity).add(prev) : prev
        }, Dec(0))
      return sum.isZero() ? Dec(0) : weightedYTM.div(sum)
    }
  }, [weightedYTM])

  const currentYTM = React.useMemo(() => {
    const termDays = loan?.pricing ? daysBetween(new Date(), loan?.pricing.maturityDate) : 0

    return currentFace && loan && 'presentValue' in loan && termDays > 0
      ? currentFace
          ?.sub(loan.presentValue.toDecimal())
          .div(loan.presentValue.toDecimal())
          .mul(Dec(365).div(Dec(termDays)))
          .mul(100)
      : null
  }, [loan])

  return (
    <Stack>
      <Box mt={2} ml={2}>
        <RouterLinkButton to={`${basePath}/${poolId}/assets`} small icon={IconChevronLeft} variant="tertiary">
          {poolMetadata?.pool?.name ?? 'Pool assets'}
        </RouterLinkButton>
      </Box>
      <Box pl={3} pt={2}>
        <Text variant="heading1" as="h1" style={{ wordBreak: 'break-word' }}>
          Asset Overview
        </Text>
      </Box>
      <PageHeader
        icon={
          loanId === '0' ? (
            <Box as="img" src={usdcLogo} alt="" height="iconMedium" width="iconMedium" />
          ) : (
            <Thumbnail type="asset" label={loan?.id ?? ''} size="large" />
          )
        }
        title={<TextWithPlaceholder isLoading={metadataIsLoading}>{name}</TextWithPlaceholder>}
        subtitle={loan && !isTinlakeLoan(loan) && <FinanceButton loan={loan} />}
        actions={
          showAssetSnapshots && (
            <AnchorButton
              href={dataUrl}
              download={`asset-${loanId}-timeseries.csv`}
              variant="secondary"
              icon={IconDownload}
              small
            >
              Timeseries
            </AnchorButton>
          )
        }
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
      {loan &&
        pool &&
        (loan.pricing.maturityDate || templateMetadata?.keyAttributes?.length || 'oracle' in loan.pricing) && (
          <>
            <AssetSummary
              loan={loan}
              data={[
                ...('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash'
                  ? templateMetadata?.keyAttributes
                      ?.filter((key) => templateMetadata?.attributes?.[key].public)
                      .map((key) => ({
                        label: templateMetadata?.attributes?.[key].label,
                        value: isValidDate(nftMetadata?.properties[key])
                          ? formatDate(nftMetadata?.properties[key])
                          : nftMetadata?.properties[key],
                      })) || []
                  : []),
                ...(loan.pricing.maturityDate &&
                'valuationMethod' in loan.pricing &&
                loan.pricing.valuationMethod !== 'cash'
                  ? [
                      {
                        label: 'Maturity date',
                        value: formatDate(loan.pricing.maturityDate),
                      },
                    ]
                  : []),
                ...[
                  {
                    label: 'Current value',
                    value: `${formatBalance(
                      'presentValue' in loan ? loan.presentValue : new CurrencyBalance(0, pool.currency.decimals),
                      pool.currency.symbol,
                      2,
                      2
                    )}`,
                  },
                ],
                ...(loan.pricing.maturityDate &&
                'valuationMethod' in loan.pricing &&
                loan.pricing.valuationMethod === 'oracle' &&
                loan.pricing.notional.gtn(0) &&
                currentYTM
                  ? [{ label: <Tooltips type="currentYtm" />, value: formatPercentage(currentYTM) }]
                  : []),
                ...(loan.pricing.maturityDate &&
                'valuationMethod' in loan.pricing &&
                loan.pricing.valuationMethod === 'oracle' &&
                loan.pricing.notional.gtn(0) &&
                averageWeightedYTM
                  ? [{ label: <Tooltips type="averageYtm" />, value: formatPercentage(averageWeightedYTM) }]
                  : []),
              ]}
            />

            {(!isTinlakePool || (isTinlakePool && loan.status === 'Closed' && 'dateClosed' in loan)) &&
            'valuationMethod' in loan.pricing &&
            loan.pricing.valuationMethod !== 'oracle' &&
            loan.pricing.valuationMethod !== 'cash' ? (
              <PageSection title={<Box>Financing & repayment cash flow</Box>}>
                <Shelf gap={3} flexWrap="wrap">
                  {isTinlakePool && loan.status === 'Closed' && 'dateClosed' in loan ? (
                    <LabelValueStack label="Date closed" value={formatDate(loan.dateClosed)} />
                  ) : (
                    <FinancingRepayment
                      drawDownDate={'originationDate' in loan ? formatDate(loan.originationDate) : null}
                      closingDate={null}
                      outstandingPrincipal={formatBalance(
                        'outstandingPrincipal' in loan ? loan.outstandingPrincipal : 0,
                        pool.currency
                      )}
                      outstandingInterest={formatBalance(
                        'outstandingInterest' in loan ? loan.outstandingInterest : 0,
                        pool.currency
                      )}
                      repaidPrincipal={formatBalance('repaid' in loan ? loan.repaid.principal : 0, pool.currency)}
                      repaidInterest={formatBalance('repaid' in loan ? loan.repaid.interest : 0, pool.currency)}
                      repaidUnscheduled={
                        'repaid' in loan && !loan.repaid.unscheduled.isZero()
                          ? formatBalance(loan.repaid.unscheduled, pool.currency)
                          : null
                      }
                    />
                  )}
                </Shelf>
              </PageSection>
            ) : null}

            {assetSnapshots && (
              <PageSection
                title={
                  <Box>
                    {'valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash'
                      ? 'Asset performance'
                      : 'Cash balance'}
                  </Box>
                }
              >
                <Grid
                  height="fit-content"
                  gridTemplateColumns={['1fr', '1fr', '66fr minmax(275px, 33fr)']}
                  gap={[2, 2, 3]}
                >
                  <React.Suspense fallback={<Spinner />}>
                    <AssetPerformanceChart poolId={poolId} loanId={loanId} />
                  </React.Suspense>
                </Grid>
                <Shelf width="500px" flexWrap="wrap"></Shelf>
              </PageSection>
            )}

            {'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle' && (
              <PageSection title={<Box>Holdings</Box>}>
                <Shelf gap={6} flexWrap="wrap">
                  <HoldingsValues
                    pool={pool as Pool}
                    transactions={borrowerAssetTransactions}
                    currentFace={currentFace}
                    pricing={loan.pricing}
                  />
                </Shelf>
              </PageSection>
            )}

            {'valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash' && (
              <PageSection title={<Box>Pricing</Box>}>
                <Stack>
                  <Shelf gap={6} flexWrap="wrap">
                    <PricingValues loan={loan} pool={pool} />
                  </Shelf>
                </Stack>
              </PageSection>
            )}

            {borrowerAssetTransactions?.length ? (
              'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'cash' ? (
                <PageSection>
                  <TransactionHistoryTable
                    transactions={borrowerAssetTransactions ?? []}
                    poolId={poolId}
                    preview={false}
                    activeAssetId={loanId}
                  />
                </PageSection>
              ) : (
                <PageSection
                  title={
                    <Flex>
                      <Text>Transaction history</Text>
                    </Flex>
                  }
                >
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
                </PageSection>
              )
            ) : null}

            {loan.status === 'Active' &&
              loan.pricing.maturityDate &&
              'valuationMethod' in loan.pricing &&
              loan.pricing.valuationMethod !== 'oracle' &&
              loan.pricing.valuationMethod !== 'cash' && (
                <PageSection title={<Box>Remaining maturity</Box>}>
                  <Shelf gap={4} pt={maturityPercentage !== 1 ? 4 : 0}>
                    <LabelValueStack label="Origination date" value={formatDate(originationDate!)} />
                    <Box width="60%" backgroundColor="borderPrimary" position="relative">
                      <Box height="16px" width={maturityPercentage} backgroundColor="primarySelectedBackground" />
                      <Box position="absolute" left={`${maturityPercentage * 100}%`} bottom={0}>
                        <Box width="1px" height="24px" backgroundColor="primarySelectedBackground" />
                      </Box>
                      {maturityPercentage !== 1 && (
                        <Box position="absolute" left={`${maturityPercentage * 100 - 9}%`} bottom="36px" width="100px">
                          <LabelValueStack label="Today" value={formatDate(new Date())} />
                        </Box>
                      )}
                    </Box>
                    <LabelValueStack label="Maturity date" value={formatDate(loan.pricing.maturityDate)} />
                  </Shelf>
                </PageSection>
              )}
          </>
        )}
      {(loan && nft) || isTinlakePool ? (
        <>
          {templateData?.sections?.map((section, i) => {
            const isPublic = section.attributes.every((key) => templateData.attributes?.[key]?.public)
            if (!isPublic) return null
            return (
              <PageSection title={<Box>{section.name}</Box>} titleAddition={isPublic ? undefined : 'Private'} key={i}>
                {isPublic ? (
                  <Shelf gap={6} flexWrap="wrap">
                    {section.attributes.map((key) => {
                      const attribute = templateData.attributes?.[key]
                      if (!attribute) return null
                      const value = publicData[key]
                      const formatted = value ? formatNftAttribute(value, attribute) : '-'
                      return <LabelValueStack label={attribute.label} value={formatted} key={key} />
                    })}
                  </Shelf>
                ) : null}
              </PageSection>
            )
          })}

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
        </>
      ) : null}
    </Stack>
  )
}
