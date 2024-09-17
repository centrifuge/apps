import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Accordion, AnchorButton, Box, IconExternalLink, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { LabelValueStack } from './LabelValueStack'
import { PillButton } from './PillButton'
import { AnchorTextLink } from './TextLink'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
}

export function ReportDetails({ metadata }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const report = metadata?.pool?.reports?.[0]

  return (
    <Stack gap={2}>
      <Text variant="heading2">Pool analysis</Text>
      <Shelf flexDirection="column" alignItems="flex-start">
        {report && (
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
              <LabelValueStack label="Reviewer" value={<Text variant="body2">{report.author.name}</Text>} />
              <LabelValueStack label="Reviewer title" value={<Text variant="body2">{report.author.title}</Text>} />
            </Shelf>
            <Shelf marginTop={20}>
              <AnchorButton href={report.uri} target="_blank" variant="secondary" icon={IconExternalLink}>
                View full analysis
              </AnchorButton>
            </Shelf>
          </>
        )}
      </Shelf>
    </Stack>
  )
}

export function IssuerDetails({ metadata }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  return (
    <Stack gap={2}>
      <Stack gap={1}>
        {metadata?.pool?.issuer.logo && (
          <Box
            as="img"
            maxWidth={80}
            maxHeight={30}
            alt={metadata?.pool?.issuer.name}
            src={cent.metadata.parseMetadataUrl(metadata?.pool?.issuer.logo?.uri)}
          />
        )}
        <LabelValueStack label="Issuer" value={<Text variant="body2">{metadata?.pool?.issuer.name}</Text>} />
        <LabelValueStack
          label="Legal representative"
          value={<Text variant="body2">{metadata?.pool?.issuer.repName}</Text>}
        />
        <LabelValueStack
          label="Short description"
          value={<Text variant="body2">{metadata?.pool?.issuer.shortDescription}</Text>}
        />
        <LabelValueStack
          label="Description"
          value={<Text variant="body2">{metadata?.pool?.issuer.description}</Text>}
        />
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
      </Stack>

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
    </Stack>
  )
}

export function RatingDetails({ metadata }: IssuerSectionProps) {
  const rating = metadata?.pool?.rating

  return (
    <Stack gap={1}>
      <Text variant="heading2">Pool rating</Text>
      <Shelf flexDirection="column" alignItems="flex-start">
        {rating && (
          <Shelf gap={1}>
            <LabelValueStack label="Rating agency" value={<Text variant="body2">{rating.ratingAgency}</Text>} />
            <LabelValueStack label="Rating" value={<Text variant="body2">{rating.ratingValue}</Text>} />
          </Shelf>
        )}
      </Shelf>
      <Shelf>
        {rating?.ratingReportUrl && (
          <AnchorButton href={rating.ratingReportUrl} target="_blank" variant="secondary" icon={IconExternalLink}>
            View full report
          </AnchorButton>
        )}
      </Shelf>
    </Stack>
  )
}
