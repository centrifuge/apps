import { Box, Card, IconChevronLeft, IconNft, InteractiveCard, Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useParams } from 'react-router'
import { CardHeader } from '../../components/CardHeader'
import { Identity } from '../../components/Identity'
import LoanLabel from '../../components/LoanLabel'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { PageSummary } from '../../components/PageSummary'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { AnchorPillButton } from '../../components/PillButton'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { TextWithPlaceholder } from '../../components/TextWithPlaceholder'
import { Tooltips } from '../../components/Tooltips'
import { nftMetadataSchema } from '../../schemas'
import { formatBalance } from '../../utils/formatting'
import { parseMetadataUrl } from '../../utils/parseMetadataUrl'
import { useAddress } from '../../utils/useAddress'
import { useLoan } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useLoanNft, useNFT } from '../../utils/useNFTs'
import { usePermissions } from '../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { isSameAddress } from '../../utils/web3'
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
  const loanNft = useLoanNft(pid, aid)
  const permissions = usePermissions(address)
  const isLoanOwner = isSameAddress(loanNft?.owner, address)
  const canBorrow = permissions?.pools[pid]?.roles.includes('Borrower') && isLoanOwner

  if (!loan || loan.status === 'Created' || !permissions) return null

  return canBorrow ? (
    <FinanceForm loan={loan} />
  ) : (
    <Card p={2}>
      <Stack gap={2}>
        <CardHeader title="Finance &amp; Repay" />
        <Text variant="body2">You don&rsquo;t have permission to finance this asset</Text>
      </Stack>
    </Card>
  )
}

const Loan: React.FC = () => {
  const { pid, aid } = useParams<{ pid: string; aid: string }>()
  const pool = usePool(pid)
  const loan = useLoan(pid, aid)
  const { data: poolMetadata, isLoading: poolMetadataIsLoading } = usePoolMetadata(pool)
  const nft = useNFT(loan?.asset.collectionId, loan?.asset.nftId, false)
  const { data: nftMetadata, isLoading: nftMetadataIsLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const address = useAddress()
  const permissions = usePermissions(address)
  const history = useHistory()
  const metadataIsLoading = poolMetadataIsLoading || nftMetadataIsLoading

  const canPrice = permissions?.pools[pid]?.roles.includes('PricingAdmin')

  const name = truncate(nftMetadata?.name || 'Unnamed asset', 30)
  const imageUrl = nftMetadata?.image ? parseMetadataUrl(nftMetadata.image) : ''

  const riskGroupIndex = loan && poolMetadata?.riskGroups && getMatchingRiskGroupIndex(loan, poolMetadata.riskGroups)

  return (
    <Stack>
      <PageHeader
        icon={<Thumbnail type="asset" label={loan?.id ?? ''} size="large" />}
        title={<TextWithPlaceholder isLoading={metadataIsLoading}>{name}</TextWithPlaceholder>}
        titleAddition={loan && <LoanLabel loan={loan} />}
        parent={{ to: `/pools/${pid}/assets`, label: 'Assets' }}
        subtitle={
          <TextWithPlaceholder isLoading={metadataIsLoading}>
            {poolMetadata?.pool?.asset.class} asset
          </TextWithPlaceholder>
        }
        actions={
          <RouterLinkButton icon={IconChevronLeft} to={`/pools/${pid}`} variant="tertiary" small>
            {poolMetadata?.pool?.name ?? ''}
          </RouterLinkButton>
        }
      />
      {loan &&
        pool &&
        (loan.status !== 'Created' ? (
          <>
            <PageSummary
              data={[
                {
                  label: <Tooltips type="loanType" />,
                  value: loan?.loanInfo.type ? LOAN_TYPE_LABELS[loan.loanInfo.type] : '',
                },
                {
                  label: <Tooltips type="collateralValue" />,
                  value: formatBalance(loan.loanInfo.value, pool?.currency),
                },
                {
                  label: <Tooltips type="riskGroup" />,
                  value: (
                    <TextWithPlaceholder isLoading={metadataIsLoading}>
                      {riskGroupIndex !== undefined && riskGroupIndex > -1
                        ? poolMetadata?.riskGroups?.[riskGroupIndex]?.name || `Risk group ${riskGroupIndex + 1}`
                        : 'n/a'}
                    </TextWithPlaceholder>
                  ),
                },
              ]}
            />
            <PageSection title="Pricing">
              <RiskGroupValues
                values={{ ...loan.loanInfo, interestRatePerSec: loan.interestRatePerSec }}
                loanType={loan.loanInfo.type}
                showMaturityDate
              />
            </PageSection>
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
            icon={<Thumbnail label="nft" type="pool" />}
            title={<TextWithPlaceholder isLoading={nftMetadataIsLoading}>{nftMetadata?.name}</TextWithPlaceholder>}
            variant="button"
            onClick={() => history.push(`/collection/${loan?.asset.collectionId}/object/${loan?.asset.nftId}`)}
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
                {imageUrl ? <Box as="img" maxWidth="100%" src={imageUrl} /> : <IconNft color="white" size="250px" />}
              </Box>
              <Stack gap={2}>
                <Stack gap={1}>
                  <Text variant="label1">Description</Text>
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
                </Stack>

                {imageUrl && (
                  <Stack gap={1} alignItems="flex-start">
                    <Text variant="label1">Image</Text>
                    <AnchorPillButton
                      href={imageUrl}
                      target="_blank"
                      style={{ wordBreak: 'break-all', whiteSpace: 'initial' }}
                    >
                      Source file
                    </AnchorPillButton>
                  </Stack>
                )}

                <Stack gap={1}>
                  <Text variant="label1">Owner</Text>
                  <Text variant="label2" color="textPrimary">
                    <Identity address={nft.owner} clickToCopy />
                  </Text>
                </Stack>
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
