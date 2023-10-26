import { CurrencyBalance, Loan as LoanType, Pool, PricingInfo, TinlakeLoan } from '@centrifuge/centrifuge-js'
import {
  AnchorButton,
  Box,
  Button,
  Flex,
  IconChevronLeft,
  IconExternalLink,
  Shelf,
  Stack,
  Text,
  TextWithPlaceholder,
  Thumbnail,
  truncate,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useParams, useRouteMatch } from 'react-router'
import { AssetSummary } from '../../components/AssetSummary'
import { LabelValueStack } from '../../components/LabelValueStack'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { PodAuthSection } from '../../components/PodAuthSection'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { Tooltips } from '../../components/Tooltips'
import { nftMetadataSchema } from '../../schemas'
import { LoanTemplate } from '../../types'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { daysBetween, formatDate, isValidDate } from '../../utils/date'
import { formatBalance, truncateText } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { useLoan, useNftDocumentId } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useCanBorrowAsset, useCanSetOraclePrice } from '../../utils/usePermissions'
import { usePodDocument } from '../../utils/usePodDocument'
import { useBorrowerAssetTransactions, usePool, usePoolMetadata } from '../../utils/usePools'
import { FinanceForm } from './FinanceForm'
import { FinancingRepayment } from './FinancingRepayment'
import { HoldingsValues } from './HoldingsValues'
import { OraclePriceForm } from './OraclePriceForm'
import { PricingValues } from './PricingValues'
import { TransactionTable } from './TransactionTable'
import { formatNftAttribute } from './utils'

export default function LoanPage() {
  const [showOraclePricing, setShowOraclePricing] = React.useState(false)
  return (
    <PageWithSideBar
      sidebar={<LoanSidebar showOraclePricing={showOraclePricing} setShowOraclePricing={setShowOraclePricing} />}
    >
      <Loan setShowOraclePricing={() => setShowOraclePricing(true)} />
    </PageWithSideBar>
  )
}

function isTinlakeLoan(loan: LoanType | TinlakeLoan): loan is TinlakeLoan {
  return loan.poolId.startsWith('0x')
}

const LoanSidebar: React.FC<{
  showOraclePricing?: boolean
  setShowOraclePricing: (showOraclePricing: boolean) => void
}> = ({ showOraclePricing, setShowOraclePricing }) => {
  const { pid, aid } = useParams<{ pid: string; aid: string }>()
  const loan = useLoan(pid, aid)
  const canBorrow = useCanBorrowAsset(pid, aid)

  if (!loan || loan.status === 'Closed' || !canBorrow || isTinlakeLoan(loan)) return null

  return (
    <Stack gap={2}>
      {showOraclePricing && <OraclePriceForm loan={loan} setShowOraclePricing={setShowOraclePricing} />}
      <FinanceForm loan={loan} />
    </Stack>
  )
}

const Loan: React.FC<{ setShowOraclePricing?: () => void }> = ({ setShowOraclePricing }) => {
  const { pid: poolId, aid: assetId } = useParams<{ pid: string; aid: string }>()
  const isTinlakePool = poolId.startsWith('0x')
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''
  const pool = usePool(poolId)
  const loan = useLoan(poolId, assetId)
  const { data: poolMetadata, isLoading: poolMetadataIsLoading } = usePoolMetadata(pool)
  const nft = useCentNFT(loan?.asset.collectionId, loan?.asset.nftId, false)
  const { data: nftMetadata, isLoading: nftMetadataIsLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const history = useHistory()
  const metadataIsLoading = poolMetadataIsLoading || nftMetadataIsLoading
  const address = useAddress()
  const canOraclePrice = useCanSetOraclePrice(address)
  const borrowerAssetTransactions = useBorrowerAssetTransactions(poolId, assetId)

  const currentFace =
    loan?.pricing && 'outstandingQuantity' in loan.pricing
      ? loan.pricing.outstandingQuantity.toDecimal().mul(loan.pricing.notional.toDecimal())
      : null

  const templateIds = poolMetadata?.loanTemplates?.map((s) => s.id) ?? []
  const templateId = templateIds.at(-1)
  const { data: templateMetadata } = useMetadata<LoanTemplate>(templateId)

  const name = truncateText((isTinlakePool ? loan?.asset.nftId : nftMetadata?.name) || 'Unnamed asset', 30)

  const { data: templateData } = useMetadata<LoanTemplate>(
    nftMetadata?.properties?._template && `ipfs://${nftMetadata?.properties?._template}`
  )

  const documentId = useNftDocumentId(nft?.collectionId, nft?.id)
  const { data: document } = usePodDocument(poolId, documentId)

  const publicData = nftMetadata?.properties
    ? Object.fromEntries(Object.entries(nftMetadata.properties).map(([key, obj]: any) => [key, obj]))
    : {}
  const privateData = document?.attributes
    ? Object.fromEntries(Object.entries(document.attributes).map(([key, obj]: any) => [key, obj.value]))
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
        icon={<Thumbnail type="asset" label={loan?.id ?? ''} size="large" />}
        title={<TextWithPlaceholder isLoading={metadataIsLoading}>{name}</TextWithPlaceholder>}
        subtitle={
          <Flex>
            <AnchorButton
              onClick={() => history.push(`/nfts/collection/${loan?.asset.collectionId}/object/${loan?.asset.nftId}`)}
              icon={IconExternalLink}
              small
              variant="tertiary"
            >
              View NFT
            </AnchorButton>
          </Flex>
        }
      />
      {loan &&
        pool &&
        (loan.pricing.maturityDate || templateMetadata?.keyAttributes?.length || 'oracle' in loan.pricing) && (
          <>
            <AssetSummary
              loan={loan}
              data={[
                ...(templateMetadata?.keyAttributes
                  ?.filter((key) => templateMetadata?.attributes?.[key].public)
                  .map((key) => ({
                    label: templateMetadata?.attributes?.[key].label,
                    value: isValidDate(nftMetadata?.properties[key])
                      ? formatDate(nftMetadata?.properties[key])
                      : nftMetadata?.properties[key],
                  })) || []),
                ...(loan.pricing.maturityDate
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
              ]}
            />

            {(!isTinlakePool || (isTinlakePool && loan.status === 'Closed' && 'dateClosed' in loan)) &&
            'valuationMethod' in loan.pricing &&
            loan.pricing.valuationMethod !== 'oracle' ? (
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

            <PageSection title={<Box>Pricing</Box>}>
              <Stack>
                <Shelf gap={6} flexWrap="wrap">
                  <PricingValues loan={loan} pool={pool} />
                </Shelf>
                {canOraclePrice &&
                  setShowOraclePricing &&
                  loan.status !== 'Closed' &&
                  'valuationMethod' in loan.pricing &&
                  loan.pricing.valuationMethod === 'oracle' && (
                    <Box marginTop="3">
                      <Button variant="primary" onClick={() => setShowOraclePricing()} small>
                        Update price
                      </Button>
                    </Box>
                  )}
              </Stack>
            </PageSection>

            {loan.status === 'Active' && loan.pricing.maturityDate && (
              <PageSection title={<Box>Remaining maturity</Box>}>
                <Shelf gap={4} pt={maturityPercentage !== 1 ? 4 : 0}>
                  <LabelValueStack label="Origination date" value={formatDate(originationDate!)} />
                  <Box width="60%" backgroundColor="borderSecondary" position="relative">
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

            {borrowerAssetTransactions?.length ? (
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
                  decimals={pool.currency.decimals}
                  pricing={loan.pricing as PricingInfo}
                />
              </PageSection>
            ) : null}
          </>
        )}
      {(loan && nft) || isTinlakePool ? (
        <>
          {templateData?.sections?.map((section, i) => {
            const isPublic = section.attributes.every((key) => templateData.attributes?.[key]?.public)
            return (
              <PageSection title={<Box>{section.name}</Box>} titleAddition={isPublic ? undefined : 'Private'} key={i}>
                {isPublic || document ? (
                  <Shelf gap={6} flexWrap="wrap">
                    {section.attributes.map((key) => {
                      const attribute = templateData.attributes?.[key]
                      if (!attribute) return null
                      const value = publicData[key] ?? privateData[key]
                      const formatted = value ? formatNftAttribute(value, attribute) : '-'
                      return <LabelValueStack label={attribute.label} value={formatted} key={key} />
                    })}
                  </Shelf>
                ) : !isPublic ? (
                  <PodAuthSection poolId={poolId} buttonLabel="Authenticate to view" />
                ) : null}
              </PageSection>
            )
          })}

          {isTinlakePool && loan && 'owner' in loan ? (
            <PageSection title={<Box>NFT</Box>}>
              <Shelf gap={6}>
                <LabelValueStack label={<Tooltips variant="secondary" type="id" />} value={assetId} />
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
