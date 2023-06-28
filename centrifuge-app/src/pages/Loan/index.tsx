import { CurrencyBalance, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  Box,
  IconNft,
  InteractiveCard,
  Shelf,
  Stack,
  Text,
  TextWithPlaceholder,
  Thumbnail,
  truncate,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useParams, useRouteMatch } from 'react-router'
import { Identity } from '../../components/Identity'
import { LabelValueStack } from '../../components/LabelValueStack'
import LoanLabel from '../../components/LoanLabel'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { PageSummary } from '../../components/PageSummary'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { AnchorPillButton } from '../../components/PillButton'
import { PodAuthSection } from '../../components/PodAuthSection'
import { Tooltips } from '../../components/Tooltips'
import { nftMetadataSchema } from '../../schemas'
import { LoanTemplate, LoanTemplateAttribute } from '../../types'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { formatDate } from '../../utils/date'
import { formatBalance, truncateText } from '../../utils/formatting'
import { useAvailableFinancing, useLoan, useNftDocumentId } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useCanBorrowAsset } from '../../utils/usePermissions'
import { usePodDocument } from '../../utils/usePodDocument'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { FinanceForm } from './FinanceForm'
import { FinancingRepayment } from './FinancingRepayment'
import { PricingValues } from './PricingValues'

export const LoanPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar={<LoanSidebar />}>
      <Loan />
    </PageWithSideBar>
  )
}

const LoanSidebar: React.FC = () => {
  const { pid, aid } = useParams<{ pid: string; aid: string }>()
  const loan = useLoan(pid, aid)
  const canBorrow = useCanBorrowAsset(pid, aid)

  if (!loan || loan.status === 'Closed' || !canBorrow) return null

  return <FinanceForm loan={loan} />
}

const Loan: React.FC = () => {
  const { pid: poolId, aid: assetId } = useParams<{ pid: string; aid: string }>()
  const isTinlakePool = poolId.startsWith('0x')
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''
  const pool = usePool(poolId)
  const loan = useLoan(poolId, assetId)
  const { data: poolMetadata, isLoading: poolMetadataIsLoading } = usePoolMetadata(pool)
  const nft = useCentNFT(loan?.asset.collectionId, loan?.asset.nftId, false)
  const { data: nftMetadata, isLoading: nftMetadataIsLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const history = useHistory()
  const cent = useCentrifuge()
  const { current: availableFinancing } = useAvailableFinancing(poolId, assetId)
  const metadataIsLoading = poolMetadataIsLoading || nftMetadataIsLoading

  const name = truncateText((isTinlakePool ? loan?.asset.nftId : nftMetadata?.name) || 'Unnamed asset', 30)
  const imageUrl = nftMetadata?.image ? cent.metadata.parseMetadataUrl(nftMetadata.image) : ''

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

  return (
    <Stack>
      <PageHeader
        icon={<Thumbnail type="asset" label={loan?.id ?? ''} size="large" />}
        title={<TextWithPlaceholder isLoading={metadataIsLoading}>{name}</TextWithPlaceholder>}
        titleAddition={loan && <LoanLabel loan={loan} />}
        parent={{ to: `${basePath}/${poolId}/assets`, label: poolMetadata?.pool?.name ?? 'Pool assets' }}
        subtitle={
          <TextWithPlaceholder isLoading={metadataIsLoading}>
            {poolMetadata?.pool?.asset.class} asset by{' '}
            {isTinlakePool && (loan as TinlakeLoan)?.owner
              ? truncate((loan as TinlakeLoan).owner)
              : nft?.owner && <Identity clickToCopy address={nft?.owner} />}
          </TextWithPlaceholder>
        }
      />
      {loan && pool && (
        <>
          <PageSummary
            data={[
              // {
              //   label: <Tooltips type={isTinlakePool ? 'riskGroup' : 'collateralValue'} />,
              //   value: isTinlakePool
              //     ? (loan as TinlakeLoan).riskGroup
              //     : (loan as LoanType).pricing.value
              //     ? formatBalance((loan as LoanType).pricing.value, pool?.currency.symbol)
              //     : 'n/a',
              // },
              {
                label: <Tooltips type="availableFinancing" />,
                value: formatBalance(availableFinancing, pool?.currency.symbol),
              },
              {
                label: <Tooltips type="outstanding" />,
                value: 'outstandingDebt' in loan ? formatBalance(loan.outstandingDebt, pool?.currency.symbol) : 'n/a',
              },
            ]}
          />

          {!isTinlakePool || (isTinlakePool && loan.status === 'Closed' && (loan as TinlakeLoan).dateClosed) ? (
            <PageSection title="Financing & repayment cash flow">
              <Shelf gap={3} flexWrap="wrap">
                {isTinlakePool && loan.status === 'Closed' && (loan as TinlakeLoan).dateClosed ? (
                  <LabelValueStack label="Date closed" value={formatDate((loan as TinlakeLoan).dateClosed)} />
                ) : (
                  <FinancingRepayment
                    drawDownDate={'originationDate' in loan ? formatDate(loan.originationDate) : null}
                    closingDate={null}
                    totalFinanced={formatBalance('totalBorrowed' in loan ? loan.totalBorrowed : 0, pool.currency)}
                    totalRepaid={formatBalance('totalBorrowed' in loan ? loan.totalRepaid : 0, pool.currency)}
                  />
                )}
              </Shelf>
            </PageSection>
          ) : null}

          <PageSection title="Pricing">
            <Shelf gap={3} flexWrap="wrap">
              <PricingValues loan={loan} />
            </Shelf>
          </PageSection>
        </>
      )}
      {(loan && nft) || loan?.poolId.startsWith('0x') ? (
        <>
          {templateData?.sections?.map((section, i) => {
            const isPublic = section.attributes.every((key) => templateData.attributes?.[key]?.public)
            return (
              <PageSection title={section.name} titleAddition={isPublic ? undefined : 'Private'} key={i}>
                {isPublic || document ? (
                  <Shelf gap={6} flexWrap="wrap">
                    {section.attributes.map((key) => {
                      const attribute = templateData.attributes?.[key]
                      if (!attribute) return null
                      const value = publicData[key] ?? privateData[key]
                      const formatted = value ? formatValue(value, attribute) : '-'
                      return <LabelValueStack label={attribute.label} value={formatted} key={key} />
                    })}
                  </Shelf>
                ) : !isPublic ? (
                  <PodAuthSection poolId={poolId} buttonLabel="Authenticate to view" />
                ) : null}
              </PageSection>
            )
          })}

          <PageSection title="NFT">
            {isTinlakePool && (loan as TinlakeLoan).owner ? (
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
                      onClick={() => copyToClipboard((loan as TinlakeLoan).owner || '')}
                    >
                      {truncate((loan as TinlakeLoan).owner)}
                    </Text>
                  }
                />
              </Shelf>
            ) : (
              <InteractiveCard
                icon={<Thumbnail label="nft" type="nft" />}
                title={<TextWithPlaceholder isLoading={nftMetadataIsLoading}>{nftMetadata?.name}</TextWithPlaceholder>}
                variant="button"
                onClick={() => history.push(`/nfts/collection/${loan?.asset.collectionId}/object/${loan?.asset.nftId}`)}
                secondaryHeader={
                  <Shelf gap={6}>
                    <LabelValueStack label={<Tooltips variant="secondary" type="id" />} value={assetId} />
                    <LabelValueStack
                      label="Owner"
                      value={nft?.owner ? <Identity clickToCopy address={nft.owner} /> : ''}
                    />
                  </Shelf>
                }
              >
                {(nftMetadata?.description || imageUrl) && (
                  <Shelf gap={3} alignItems="flex-start">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flex="0 1 50%"
                      style={{ aspectRatio: '1 / 1' }}
                      backgroundColor="backgroundSecondary"
                      borderRadius="8px"
                      overflow="hidden"
                    >
                      {imageUrl ? (
                        <Box as="img" maxWidth="100%" maxHeight="100%" src={imageUrl} />
                      ) : (
                        <IconNft color="white" size="250px" />
                      )}
                    </Box>
                    <Stack gap={2}>
                      <LabelValueStack
                        label="Description"
                        value={
                          <TextWithPlaceholder
                            isLoading={nftMetadataIsLoading}
                            words={2}
                            width={80}
                            variance={30}
                            variant="body2"
                            style={{ wordBreak: 'break-word' }}
                          >
                            {nftMetadata?.description || 'No description'}
                          </TextWithPlaceholder>
                        }
                      />

                      {imageUrl && (
                        <LabelValueStack
                          label="Image"
                          value={
                            <AnchorPillButton
                              href={imageUrl}
                              target="_blank"
                              style={{ wordBreak: 'break-all', whiteSpace: 'initial' }}
                            >
                              Source file
                            </AnchorPillButton>
                          }
                        />
                      )}
                    </Stack>
                  </Shelf>
                )}
              </InteractiveCard>
            )}
          </PageSection>
        </>
      ) : null}
    </Stack>
  )
}

function formatValue(value: any, attr: LoanTemplateAttribute) {
  switch (attr.input.type) {
    case 'number':
      return `${(attr.input.decimals
        ? new CurrencyBalance(value, attr.input.decimals).toFloat()
        : Number(value)
      ).toLocaleString('en')} ${attr.input.unit || ''}`
    case 'currency':
      return formatBalance(
        attr.input.decimals ? new CurrencyBalance(value, attr.input.decimals) : Number(value),
        attr.input.symbol
      )
    case 'date':
      return formatDate(value)
    default:
      return value
  }
}
