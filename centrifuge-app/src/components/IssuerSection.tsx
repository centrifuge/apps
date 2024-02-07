import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Accordion, AnchorButton, Box, Card, Grid, IconExternalLink, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { LabelValueStack } from './LabelValueStack'
import { AnchorPillButton, PillButton } from './PillButton'
import { AnchorTextLink } from './TextLink'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
}


export function IssuerSection({ metadata }: IssuerSectionProps) {
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
                  <PillButton variant="small" onClick={() => setIsDialogOpen(true)}>
                    Executive summary
                  </PillButton>
                  <ExecutiveSummaryDialog
                    issuerName={metadata?.pool?.issuer.name}
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
      {!!metadata?.pool?.details?.length && <Accordion items={metadata?.pool?.details} mt={4} />}
    </>
  )
}

const StyledImage = styled.img`
  min-height: 104px;
  min-width: 100px;
  max-height: 104px;
`

export function IssuerSectionNew({ metadata }: IssuerSectionProps) {
  const report = metadata?.pool?.reports?.[0]
  
  return (
    <Card p={3} backgroundColor="backgroundAccentSecondary">
      <Grid columns={[1, 2]} equalColumns gap={9} rowGap={3}>
        {report && (
          <Stack gap={2}>
            <Text variant="heading2">Pool analysis</Text>
            <ReportDetails metadata={metadata} />
          </Stack>
        )}
        <Stack gap={2}>
          <Text variant="heading2">Issuer details</Text>
          <IssuerDetails metadata={metadata} />
        </Stack>
      </Grid>
    </Card>
  )
}

export function ReportDetails({ metadata }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const report = metadata?.pool?.reports?.[0]
  return (
    report && (
      <>
        <Shelf gap={1}>
          {report.author.avatar?.uri && (
            <Box
              as="img"
              height={40}
              borderRadius={30}
              src={cent.metadata.parseMetadataUrl(report.author.avatar.uri)}
              alt=""
            />
          )}
          <Text variant="body2">
            Reviewer: {report.author.name}
            <br />
            {report.author.title}
          </Text>
        </Shelf>
        <div>
          <AnchorButton href={report.uri} target="_blank" variant="inverted" icon={IconExternalLink}>
            View full report
          </AnchorButton>
        </div>
      </>
    )
  )
}
export function IssuerDetails({ metadata }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  return (
    <>
      <Shelf gap={1}>
        <Box maxWidth={30}>
          {metadata?.pool?.issuer.logo && (
            <img
              alt={metadata?.pool?.issuer.name}
              src={cent.metadata.parseMetadataUrl(metadata?.pool?.issuer.logo?.uri)}
            />
          )}
        </Box>
        <Text variant="body2">{metadata?.pool?.issuer.name}</Text>
      </Shelf>
      <Text variant="body2">{metadata?.pool?.issuer.description}</Text>

      {metadata?.pool?.links.executiveSummary && (
        <LabelValueStack
          label="Download"
          value={
            <>
              <PillButton variant="small" onClick={() => setIsDialogOpen(true)}>
                Executive summary
              </PillButton>
              <ExecutiveSummaryDialog
                issuerName={metadata?.pool?.issuer.name}
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
            <Text variant="body3">
              <Shelf flexWrap="wrap" gap={2} alignItems="flex-start">
                {metadata?.pool?.links.website && (
                  <AnchorTextLink href={metadata?.pool?.links.website}>Website</AnchorTextLink>
                )}
                {metadata?.pool?.links.forum && (
                  <AnchorTextLink href={metadata?.pool?.links.forum}>Forum</AnchorTextLink>
                )}
                {metadata?.pool?.issuer.email && (
                  <AnchorTextLink href={`mailto:${metadata?.pool?.issuer.email}`}>Email</AnchorTextLink>
                )}
              </Shelf>
            </Text>
          }
        />
      )}
      {!!metadata?.pool?.details?.length && (
        <LabelValueStack label="Details" value={<Accordion items={metadata?.pool?.details} />} />
      )}
    </>
  )
}
