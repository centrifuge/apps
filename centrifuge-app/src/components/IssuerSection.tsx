import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Accordion, Box, Button, IconDownload, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { PaddingProps } from 'styled-system'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { LabelValueStack } from './LabelValueStack'
import { AnchorPillButton } from './PillButton'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
} & PaddingProps

export const IssuerSection: React.VFC<IssuerSectionProps> = ({ metadata }) => {
  const cent = useCentrifuge()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
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
          {metadata?.pool?.links.executiveSummary && (
            <LabelValueStack
              label="Download"
              value={
                <>
                  <Button variant="tertiary" small icon={IconDownload} onClick={() => setIsDialogOpen(true)}>
                    Executive&nbsp;summary
                  </Button>
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
