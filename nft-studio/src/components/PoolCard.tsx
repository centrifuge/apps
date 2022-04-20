import { formatCurrencyAmount, Pool } from '@centrifuge/centrifuge-js'
import { Avatar, Box, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
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

export const PoolCard: React.VFC<PoolCardProps> = ({ pool, metadata }) => {
  const theme = useTheme()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const loans = useLoans(pool.id)
  console.log('🚀 ~ loans', loans)

  // const ongoingAssets = loans ? loans.filter((asset) => asset.status && asset.status === 'ongoing') : undefined
  // const ongoingAssetsWithEnoughData = ongoingAssets
  // ? ongoingAssets.filter(
  //     (asset) => asset.interestRate && asset.maturityDate && asset.financingDate && asset.debt && !asset.debt.isZero()
  //   )
  // : undefined

  // const avgMaturity = ongoingAssetsWithEnoughData?.length
  // ? ongoingAssetsWithEnoughData
  //     .filter((asset) => asset.maturityDate && asset.financingDate)
  //     .reduce((sum, asset) => {
  //       const a =
  //         sum +
  //         (((asset.maturityDate! - asset.financingDate!) / SecondsInDay) * Number(asset.debt.toString())) / 10 ** 18
  //       return a
  //     }, 0) / totalOutstandingNum!
  // : undefined

  const poolCardSummaryData = React.useMemo(
    () => [
      {
        label: <Tooltips type="valueLocked" variant="lowercase" />,
        value: formatCurrencyAmount(new BN(pool.nav.latest).add(new BN(pool.reserve.total)).toString()),
      },
      { label: <Tooltips type="age" variant="lowercase" />, value: '10 Months' },
      { label: <Tooltips type="averageAssetMaturity" variant="lowercase" />, value: '12.3 Months' },
    ],
    [pool]
  )

  return (
    <Stack m="3" gap="2">
      <Text variant="heading2">Token pool</Text>
      <Card ml="3">
        {/* poolavatar */}
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
            <Avatar type="pool" label="LP" size="small" />
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
                <Text>{label}</Text>
                <Text variant="body2">{value}</Text>
              </Stack>
            ))}
          </Shelf>
        </Shelf>
        {/* pool details */}
        <Stack gap="2" p="2">
          <Box>
            {metadata?.pool?.issuer.logo && <StyledImage src={parseMetadataUrl(metadata?.pool?.issuer.logo)} />}
          </Box>
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
    </Stack>
  )
}

const StyledImage = styled.img`
  min-height: 100px;
  min-width: 100px;
  max-height: 104px;
`
