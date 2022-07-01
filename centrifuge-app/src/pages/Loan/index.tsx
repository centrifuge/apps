import { Box, IconNft, InteractiveCard, Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
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
import { TextWithPlaceholder } from '../../components/TextWithPlaceholder'
import { Tooltips } from '../../components/Tooltips'
import { config } from '../../config'
import { nftMetadataSchema } from '../../schemas'
import { formatBalance } from '../../utils/formatting'
import { parseMetadataUrl } from '../../utils/parseMetadataUrl'
import { useAddress } from '../../utils/useAddress'
import { useAvailableFinancing, useLoan } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useNFT } from '../../utils/useNFTs'
import { useCanBorrow, usePermissions } from '../../utils/usePermissions'
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
  const address = useAddress()
  const permissions = usePermissions(address)
  const canBorrow = useCanBorrow(pid, aid)

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
  const address = useAddress()
  const permissions = usePermissions(address)
  const history = useHistory()
  const { current: availableFinancing } = useAvailableFinancing(poolId, assetId)
  const metadataIsLoading = poolMetadataIsLoading || nftMetadataIsLoading

  const canPrice = permissions?.pools[poolId]?.roles.includes('PricingAdmin')

  const name = truncate(nftMetadata?.name || 'Unnamed asset', 30)
  const imageUrl = nftMetadata?.image ? parseMetadataUrl(nftMetadata.image) : ''

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
                  value:
                    loan?.loanInfo && loan?.loanInfo.type
                      ? LOAN_TYPE_LABELS[loan.loanInfo.type]
                      : LOAN_TYPE_LABELS[config.defaultLoanType],
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
                  value: loan.loanInfo ? formatBalance(loan.loanInfo.value, pool?.currency) : 'n/a',
                },
                {
                  label: <Tooltips type="availableForFinancing" />,
                  value: !availableFinancing.isZero() ? formatBalance(availableFinancing, pool?.currency) : 'n/a',
                },
                {
                  label: <Tooltips type="outstanding" />,
                  value: loan?.outstandingDebt.gtn(0) ? formatBalance(loan.outstandingDebt, pool?.currency) : 'n/a',
                },
              ]}
            />
            {loan?.loanInfo && (
              <PageSection title="Pricing">
                <RiskGroupValues
                  values={{ ...loan.loanInfo, interestRatePerSec: loan.interestRatePerSec }}
                  loanType={loan?.loanInfo ? loan.loanInfo.type : config.defaultLoanType}
                  showMaturityDate
                />
              </PageSection>
            )}
          </>
        ) : canPrice ? (
          <PricingForm loan={loan} pool={pool} />
        ) : (
          <PageSection title="Price">
            <Text variant="body2">You don&rsquo;t have permission to price assets for this pool</Text>
          </PageSection>
        ))}
      {loan && nft && (
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
          </InteractiveCard>
        </PageSection>
      )}
    </Stack>
  )
}

function truncate(txt: string, num: number) {
  if (txt.length > num) {
    return `${txt.slice(0, num)}...`
  }
  return txt
}
