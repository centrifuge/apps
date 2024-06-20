import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Accordion, AnchorButton, Box, IconExternalLink, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { LabelValueStack } from './LabelValueStack'
import { PillButton } from './PillButton'
import { AnchorTextLink, RouterTextLink } from './TextLink'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
}

const reportLinks = [
  { label: 'Balance sheet', href: '/balance-sheet' },
  { label: 'Profit & loss', href: '/profit-and-loss' },
  { label: 'Cashflow statement', href: '/cash-flow-statement' },
  { label: 'View all', href: '/' },
]

export function ReportDetails({ metadata }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const { pathname } = useLocation()
  const report = metadata?.pool?.reports?.[0]

  return (
    <Shelf flexDirection="column" alignItems="flex-start">
      <Shelf marginBottom={30}>
        <LabelValueStack
          label=""
          value={
            <Text variant="body1">
              <Shelf flexWrap="wrap" gap={2} alignItems="flex-start">
                {reportLinks.map((link, i) => (
                  <RouterTextLink to={`${pathname}/reporting${link.href}`} key={`${link.label}-${i}`}>
                    {link.label}
                  </RouterTextLink>
                ))}
              </Shelf>
            </Text>
          }
        />
      </Shelf>
      {report && (
        <>
          <Text style={{ marginBottom: 8 }} variant="heading2">
            Pool analysis
          </Text>
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
          <Shelf marginTop={20}>
            <AnchorButton href={report.uri} target="_blank" variant="secondary" icon={IconExternalLink}>
              View full report
            </AnchorButton>
          </Shelf>
        </>
      )}
    </Shelf>
  )
}

export function IssuerDetails({ metadata }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  return (
    <>
      <Shelf gap={1}>
        {metadata?.pool?.issuer.logo && (
          <Box
            as="img"
            maxWidth={80}
            maxHeight={30}
            alt={metadata?.pool?.issuer.name}
            src={cent.metadata.parseMetadataUrl(metadata?.pool?.issuer.logo?.uri)}
          />
        )}
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
