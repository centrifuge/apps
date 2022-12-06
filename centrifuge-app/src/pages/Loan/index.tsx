import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import {
  Box,
  IconAlertCircle,
  IconNft,
  InteractiveCard,
  Shelf,
  Stack,
  Text,
  TextWithPlaceholder,
  Thumbnail,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useParams, useRouteMatch } from 'react-router'
import { useCentrifuge } from '../../components/CentrifugeProvider'
import { Identity } from '../../components/Identity'
import { LabelValueStack } from '../../components/LabelValueStack'
import LoanLabel from '../../components/LoanLabel'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { PageSummary } from '../../components/PageSummary'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { AnchorPillButton } from '../../components/PillButton'
import { usePodAuth, usePodDocument } from '../../components/PodAuthProvider'
import { PodAuthSection } from '../../components/PodAuthSection'
import { Tooltips } from '../../components/Tooltips'
import { config } from '../../config'
import { nftMetadataSchema } from '../../schemas'
import { LoanTemplate, LoanTemplateAttribute } from '../../types'
import { formatDate } from '../../utils/date'
import { formatBalance, formatPercentage, truncateText } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { useAvailableFinancing, useLoan, useNftDocumentId } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useNFT } from '../../utils/useNFTs'
import { useCanBorrowAsset, usePermissions } from '../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { FinanceForm } from './FinanceForm'
import { PricingForm } from './PricingForm'
import { RiskGroupValues } from './RiskGroupValues'
import { getMatchingRiskGroupIndex, LOAN_TYPE_LABELS } from './utils'

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
  const pool = usePool(pid)
  const address = useAddress()
  const permissions = usePermissions(address)
  const canBorrow = useCanBorrowAsset(pid, aid)
  const canPrice = permissions?.pools[pid]?.roles.includes('PricingAdmin')

  if (loan && pool && loan?.status === 'Created' && canPrice) {
    return <PricingForm loan={loan} pool={pool} />
  }

  if (!loan || loan.status === 'Created' || !permissions || !canBorrow) return null

  return <FinanceForm loan={loan} />
}

const Loan: React.FC = () => {
  const { pid: poolId, aid: assetId } = useParams<{ pid: string; aid: string }>()
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''
  const pool = usePool(poolId)
  const loan = useLoan(poolId, assetId)
  const { data: poolMetadata, isLoading: poolMetadataIsLoading } = usePoolMetadata(pool)
  const nft = useNFT(loan?.asset.collectionId, loan?.asset.nftId, false)
  const { data: nftMetadata, isLoading: nftMetadataIsLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const history = useHistory()
  const cent = useCentrifuge()
  const { current: availableFinancing } = useAvailableFinancing(poolId, assetId)
  const metadataIsLoading = poolMetadataIsLoading || nftMetadataIsLoading

  const name = truncateText(nftMetadata?.name || 'Unnamed asset', 30)
  const imageUrl = nftMetadata?.image ? cent.metadata.parseMetadataUrl(nftMetadata.image) : ''

  const { data: templateData } = useMetadata<LoanTemplate>(
    nftMetadata?.properties?._template && `ipfs://ipfs/${nftMetadata?.properties?._template}`
  )

  const documentId = useNftDocumentId(nft?.collectionId, nft?.id)
  const podUrl = poolMetadata?.pod?.url
  const { isLoggedIn } = usePodAuth(podUrl)
  const { data: document } = usePodDocument(podUrl, documentId)

  const publicData = nftMetadata?.properties
    ? Object.fromEntries(Object.entries(nftMetadata.properties).map(([key, obj]: any) => [key, obj]))
    : {}
  const privateData = document?.attributes
    ? Object.fromEntries(Object.entries(document.attributes).map(([key, obj]: any) => [key, obj.value]))
    : {}

  const riskGroupIndex = loan && poolMetadata?.riskGroups && getMatchingRiskGroupIndex(loan, poolMetadata.riskGroups)

  return (
    <Stack>
      <PageHeader
        icon={<Thumbnail type="asset" label={loan?.id ?? ''} size="large" />}
        title={<TextWithPlaceholder isLoading={metadataIsLoading}>{name}</TextWithPlaceholder>}
        titleAddition={loan && <LoanLabel loan={loan} />}
        parent={{ to: `${basePath}/${poolId}/assets`, label: poolMetadata?.pool?.name ?? 'Pool assets' }}
        subtitle={
          <TextWithPlaceholder isLoading={metadataIsLoading}>
            {poolMetadata?.pool?.asset.class} asset by {nft?.owner && <Identity clickToCopy address={nft?.owner} />}
          </TextWithPlaceholder>
        }
      />
      {loan &&
        pool &&
        (loan.status !== 'Created' ? (
          <>
            <PageSummary
              data={[
                {
                  label: <Tooltips type="assetType" />,
                  value: LOAN_TYPE_LABELS[loan.loanInfo.type],
                },
                {
                  label: <Tooltips type="riskGroup" />,
                  value: (
                    <TextWithPlaceholder isLoading={metadataIsLoading}>
                      {riskGroupIndex != null && riskGroupIndex > -1
                        ? poolMetadata?.riskGroups?.[riskGroupIndex]?.name || `Risk group ${riskGroupIndex + 1}`
                        : 'n/a'}
                    </TextWithPlaceholder>
                  ),
                },
                {
                  label: <Tooltips type="collateralValue" />,
                  value: formatBalance(loan.loanInfo.value, pool?.currency),
                },
                {
                  label: <Tooltips type="availableFinancing" />,
                  value: !availableFinancing.isZero() ? formatBalance(availableFinancing, pool?.currency) : 'n/a',
                },
                {
                  label: <Tooltips type="outstanding" />,
                  value: loan?.outstandingDebt?.gtn(0) ? formatBalance(loan.outstandingDebt, pool?.currency) : 'n/a',
                },
              ]}
            />

            <PageSection title="Pricing">
              <Shelf gap={3} flexWrap="wrap">
                <RiskGroupValues
                  values={{ ...loan.loanInfo, interestRatePerSec: loan.interestRatePerSec }}
                  loanType={loan?.loanInfo ? loan.loanInfo.type : config.defaultLoanType}
                  showMaturityDate
                />
              </Shelf>
            </PageSection>
          </>
        ) : (
          <>
            <PageSummary
              data={[
                { label: 'Asset type', value: '-' },
                { label: 'Risk group', value: '-' },
                { label: 'Collateral value', value: '-' },
              ]}
            />
            <PageSection title="Price">
              <Shelf gap={1} justifyContent="center">
                <IconAlertCircle size="iconSmall" /> <Text variant="body3">The asset has not been priced yet</Text>
              </Shelf>
            </PageSection>
          </>
        ))}
      {loan && nft && (
        <>
          {templateData?.sections?.map((section, i) => (
            <PageSection title={section.name} titleAddition={section.public ? undefined : 'Private'} key={i}>
              {section.public || document ? (
                <Shelf gap={6} flexWrap="wrap">
                  {section.attributes.map((attr) => {
                    const key = labelToKey(attr.label)
                    const value = section.public ? publicData[key] : privateData[key]
                    const formatted = value ? formatValue(value, attr) : '-'
                    return <LabelValueStack label={attr.label} value={formatted} key={key} />
                  })}
                </Shelf>
              ) : !section.public && !isLoggedIn && podUrl ? (
                <PodAuthSection podUrl={podUrl} buttonLabel="Authenticate to view" />
              ) : null}
            </PageSection>
          ))}
          <PageSection title="NFT">
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
                    value={nft?.owner ? <Identity clickToCopy address={nft?.owner} /> : ''}
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
          </PageSection>
        </>
      )}
    </Stack>
  )
}

function labelToKey(label: string) {
  return label.toLowerCase().replaceAll(/\s/g, '_')
}

function formatValue(value: any, attr: LoanTemplateAttribute) {
  switch (attr.type) {
    case 'string':
      return value
    case 'percentage':
      return formatPercentage(value, true)
    case 'decimal':
      return value.toLocaleString('en')
    case 'currency':
      return formatBalance(new CurrencyBalance(value.match(/^[\d.]+/)[0], attr.currencyDecimals), attr.currencySymbol)
    case 'timestamp':
      return formatDate(value)
    default:
      return ''
  }
}
