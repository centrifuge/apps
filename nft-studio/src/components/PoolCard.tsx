import { formatCurrencyAmount, Pool } from '@centrifuge/centrifuge-js'
import { Box, Card, Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useLoans } from '../utils/useLoans'
import { PoolMetadata } from '../utils/usePools'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { AnchorPillButton } from './PillButton'
import { Tooltips } from './Tooltips'

type PoolCardProps = {
  pool: Pool
  metadata?: Partial<PoolMetadata>
}

const SECONDS_PER_DAY = 60 * 60 * 24

export const PoolCard: React.VFC<PoolCardProps> = ({ pool, metadata }) => {
  const theme = useTheme()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const loans = useLoans(pool.id)

  // in days
  const avgMaturity = React.useMemo(() => {
    const assets = loans?.filter((asset) => asset?.status === 'Active' || asset?.status === 'Created') || []
    const maturityPerAsset = assets
      ?.filter(
        (asset) =>
          // only assets that have outstanding debt, have been borrowed against, and have a maturity date (CreditLines do not)
          new BN(asset.outstandingDebt).gt(new BN(0)) &&
          asset.originationDate &&
          Object.keys(asset.loanInfo).includes('maturityDate')
      )
      // number of days until maturity weighted by outstanding debt
      .reduce(
        (sum, asset: any) =>
          sum +
          (((asset.loanInfo.maturityDate! - asset.originationDate!) / SECONDS_PER_DAY) *
            Number(asset.outstandingDebt.toString())) /
            1e18,
        0
      )

    const totalOutstandingDebtBN = assets.reduce((sum, asset) => sum.add(new BN(asset.outstandingDebt)), new BN(0))
    const totalOutstandingDebt = Number(totalOutstandingDebtBN.toString()) / 10 ** 18

    return maturityPerAsset / totalOutstandingDebt
  }, [loans])

  const poolCardSummaryData = [
    {
      label: <Tooltips type="valueLocked" variant="lowercase" />,
      value: formatCurrencyAmount(new BN(pool.nav.latest).add(new BN(pool.reserve.total)).toString()),
    },
    { label: <Tooltips type="age" variant="lowercase" />, value: '10 Months' },
    {
      label: <Tooltips type="averageAssetMaturity" variant="lowercase" />,
      value:
        avgMaturity > 90
          ? `${Math.round(((avgMaturity || 0) / (365 / 12)) * 10) / 10} months`
          : `${Math.round((avgMaturity || 0) * 10) / 10} days`,
    },
  ]

  return (
    <Card ml="3">
      {/* pool logo */}
      <Shelf
        p="2"
        gap="1"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        {metadata?.pool?.icon ? (
          <img src={parseMetadataUrl(metadata?.pool?.icon || '')} alt="" height="24" width="24" />
        ) : (
          <Thumbnail type="pool" label="LP" size="small" />
        )}

        <Text variant="heading2" color={theme.colors.textInteractive}>
          {metadata?.pool?.name}
        </Text>
      </Shelf>
      {/* pool summary */}
      <Shelf>
        <Shelf
          gap="6"
          p="2"
          style={{
            boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
          }}
        >
          {poolCardSummaryData?.map(({ label, value }, index) => (
            <Stack gap="2px" key={`${value}-${label}-${index}`}>
              <Text variant="label2">{label}</Text>
              <Text variant="body2">{value}</Text>
            </Stack>
          ))}
        </Shelf>
      </Shelf>
      {/* pool details */}
      <Stack gap="2" p="2">
        <Box>{metadata?.pool?.issuer.logo && <StyledImage src={parseMetadataUrl(metadata?.pool?.issuer.logo)} />}</Box>
        <Shelf gap="3" alignItems="flex-start">
          <Text variant="body2">{metadata?.pool?.issuer.description}</Text>
          <Stack gap="2">
            <Stack>
              <Text variant="label2">Issuer</Text>
              <Text variant="body2">{metadata?.pool?.issuer.name}</Text>
            </Stack>
            <Stack gap="1">
              {metadata?.pool?.links.executiveSummary && (
                <Shelf>
                  <AnchorPillButton onClick={() => setIsDialogOpen(true)}>Executive summary</AnchorPillButton>
                  <ExecutiveSummaryDialog
                    href={parseMetadataUrl(metadata?.pool?.links.executiveSummary)}
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                  />
                </Shelf>
              )}
              {metadata?.pool?.links.website && (
                <Shelf>
                  <AnchorPillButton href={metadata?.pool?.links.website}>Website</AnchorPillButton>
                </Shelf>
              )}
              {metadata?.pool?.links.forum && (
                <Shelf>
                  <AnchorPillButton href={metadata?.pool?.links.forum}>Forum</AnchorPillButton>
                </Shelf>
              )}
              {metadata?.pool?.issuer.email && (
                <Shelf>
                  <AnchorPillButton href={`mailto:${metadata?.pool?.issuer.email}`}>Email</AnchorPillButton>
                </Shelf>
              )}
            </Stack>
          </Stack>
        </Shelf>
      </Stack>
    </Card>
  )
}

const StyledImage = styled.img`
  min-height: 104px;
  min-width: 100px;
  max-height: 104px;
`
