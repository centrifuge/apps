import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useGetExplorerUrl } from '@centrifuge/centrifuge-react'
import { Accordion, Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import styled from 'styled-components'
import { PaddingProps } from 'styled-system'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { usePool } from '../utils/usePools'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { LabelValueStack } from './LabelValueStack'
import { AnchorPillButton, PillButton } from './PillButton'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
} & PaddingProps

export function IssuerSection({ metadata }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const { pid: poolId } = useParams<{ pid: string }>()
  const isTinlakePool = poolId.startsWith('0x')
  const pool = usePool(poolId)
  const network = isTinlakePool ? ((pool as TinlakePool).network === 'goerli' ? 5 : 1) : 'centrifuge'
  const explorer = useGetExplorerUrl(network)

  return (
    <>
      <Shelf alignItems="flex-start" gap="3" flexDirection={['column', 'row']}>
        <Stack gap={2}>
          <Box>
            {metadata?.pool?.issuer.logo && (
              <StyledImage src={cent.metadata.parseMetadataUrl(metadata?.pool?.issuer.logo?.uri)} />
            )}
          </Box>
          <Text variant="body2">{metadata?.pool?.issuer.description}</Text>
        </Stack>
        <Stack gap="2">
          <Box>
            <AnchorPillButton
              variant="small"
              href={explorer.address('')} // TODO: Add issuer address
            >
              View pool account
            </AnchorPillButton>
          </Box>

          {metadata?.pool?.links.executiveSummary && (
            <LabelValueStack
              label="Download"
              value={
                <>
                  <PillButton variant="small" onClick={() => setIsDialogOpen(true)}>
                    Executive summary
                  </PillButton>
                  <ExecutiveSummaryDialog
                    href={cent.metadata.parseMetadataUrl(metadata?.pool?.links.executiveSummary?.uri)}
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                  />
                </>
              }
            />
          )}

          {(metadata?.pool?.links.website || metadata?.pool?.links.forum || metadata?.pool?.issuer.email) && (
            <LabelValueStack
              label="Links"
              value={
                <Stack gap="4px">
                  {metadata?.pool?.links.website && (
                    <Shelf>
                      <AnchorPillButton variant="small" href={metadata?.pool?.links.website}>
                        Website
                      </AnchorPillButton>
                    </Shelf>
                  )}
                  {metadata?.pool?.links.forum && (
                    <Shelf>
                      <AnchorPillButton variant="small" href={metadata?.pool?.links.forum}>
                        Forum
                      </AnchorPillButton>
                    </Shelf>
                  )}
                  {metadata?.pool?.issuer.email && (
                    <Shelf>
                      <AnchorPillButton variant="small" href={`mailto:${metadata?.pool?.issuer.email}`}>
                        Email
                      </AnchorPillButton>
                    </Shelf>
                  )}
                </Stack>
              }
            />
          )}
        </Stack>
      </Shelf>
      {metadata?.pool?.details?.length && <Accordion items={metadata?.pool?.details} mt={4} />}
    </>
  )
}

const StyledImage = styled.img`
  min-height: 104px;
  min-width: 100px;
  max-height: 104px;
`
