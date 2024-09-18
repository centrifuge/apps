import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  Accordion,
  AnchorButton,
  Box,
  IconBalanceSheet,
  IconCashflow,
  IconChevronRight,
  IconExternalLink,
  IconProfitAndLoss,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
import styled from 'styled-components'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { LabelValueStack } from './LabelValueStack'
import { AnchorPillButton, PillButton } from './PillButton'
import { AnchorTextLink, RouterTextLink } from './TextLink'

const SUBTLE_GRAY = '#91969b21'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
  editView?: boolean
}

const reportLinks = [
  { label: 'Balance sheet', href: '/balance-sheet', icon: <IconBalanceSheet /> },
  { label: 'Profit & loss', href: '/profit-and-loss', icon: <IconProfitAndLoss /> },
  { label: 'Cashflow statement', href: '/cash-flow-statement', icon: <IconCashflow /> },
]

const StyledRouterTextLink = styled(RouterTextLink)`
  color: white;
  text-decoration: unset;
  font-size: 14px;
  :active {
    color: white;
  }
  :visited {
    color: white;
  }
`

export function ReportDetails({ metadata, editView }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const report = metadata?.pool?.reports?.[0]
  const pathname = useLocation().pathname
  return !editView ? (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text color="white" variant="heading4">
          Reports
        </Text>
        <Box backgroundColor={SUBTLE_GRAY} padding="8px 22px" borderRadius="4px">
          <StyledRouterTextLink to={`${pathname}/reporting`}>View all</StyledRouterTextLink>
        </Box>
      </Box>

      <Box marginY={2} backgroundColor={SUBTLE_GRAY} padding={2} borderRadius={10}>
        {reportLinks.map((link, i) => (
          <Box
            borderBottom={i === reportLinks.length - 1 ? null : `2px solid ${SUBTLE_GRAY}`}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            paddingY={3}
          >
            <Box display="flex" alignItems="center">
              {link.icon}
              <StyledRouterTextLink
                style={{ marginLeft: 8 }}
                to={`${pathname}/reporting${link.href}`}
                key={`${link.label}-${i}`}
              >
                {link.label}
              </StyledRouterTextLink>
            </Box>
            <IconChevronRight color="white" />
          </Box>
        ))}
      </Box>

      {report?.author.name && report.author.title && (
        <>
          <Text color="white" variant="heading4">
            Pool analysis
          </Text>
          <Shelf gap={1}>
            <Text variant="body4" color="textSecondary">
              Reviewer: {report.author.name}
              <br />
              {report.author.title}
            </Text>
          </Shelf>
        </>
      )}
    </>
  ) : (
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
              {report.author.name && (
                <LabelValueStack label="Reviewer" value={<Text variant="body2">{report.author.name}</Text>} />
              )}
              {report.author.title && (
                <LabelValueStack label="Reviewer title" value={<Text variant="body2">{report.author.title}</Text>} />
              )}
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

export function IssuerDetails({ metadata, editView }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const links = [
    {
      label: 'Website',
      href: metadata?.pool?.links.website,
      show: !!metadata?.pool?.links.website,
    },
    {
      label: 'Forum',
      href: metadata?.pool?.links.forum,
      show: !!metadata?.pool?.links.forum,
    },
    {
      label: 'Email',
      href: `mailto:${metadata?.pool?.issuer.email}`,
      show: !!metadata?.pool?.issuer.email,
    },
    {
      label: 'Executive Summary',
      show: !!metadata?.pool?.links.executiveSummary,
      onClick: () => setIsDialogOpen(true),
    },
  ]
  return !editView ? (
    <Stack>
      <Shelf display="flex" justifyContent="space-between" marginBottom={12}>
        {metadata?.pool?.issuer.logo && (
          <Box
            as="img"
            maxWidth={80}
            maxHeight={30}
            alt={metadata?.pool?.issuer.name}
            src={cent.metadata.parseMetadataUrl(metadata?.pool?.issuer.logo?.uri)}
          />
        )}
        <Links links={links} />
      </Shelf>
      <Box pt={4}>
        <Text variant="heading2">{metadata?.pool?.name}</Text>
        <Text variant="body2" style={{ marginTop: '12px' }}>
          {metadata?.pool?.issuer.description}
        </Text>
      </Box>
      <ExecutiveSummaryDialog
        issuerName={metadata?.pool?.issuer.name ?? ''}
        href={cent.metadata.parseMetadataUrl(metadata?.pool?.links.executiveSummary?.uri ?? '')}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      {!editView && (metadata?.pool?.links.website || metadata?.pool?.links.forum || metadata?.pool?.issuer.email) && (
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
  ) : (
    <Stack gap={2}>
      <LabelValueStack label="Issuer" value={<Text variant="body2">{metadata?.pool?.issuer.name}</Text>} />
      <LabelValueStack
        label="Legal representative"
        value={<Text variant="body2">{metadata?.pool?.issuer.repName}</Text>}
      />
      <LabelValueStack
        label="Short description"
        value={<Text variant="body2">{metadata?.pool?.issuer.shortDescription}</Text>}
      />
      <LabelValueStack label="Description" value={<Text variant="body2">{metadata?.pool?.issuer.description}</Text>} />
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
  )
}

const Links = ({ links }: { links: { label: string; href?: string; show: boolean; onClick?: () => void }[] }) => {
  return (
    <Box display="flex">
      {links.map((link, index) => {
        if (!link.show) return null

        if (link.onClick) {
          return (
            <PillButton key={`${link.label} ${index}`} variant="small" onClick={link.onClick}>
              {link.label}
            </PillButton>
          )
        }

        return (
          <AnchorPillButton style={{ marginRight: 8 }} variant="small" key={`${link.label} ${index}`} href={link.href}>
            {link.label}
          </AnchorPillButton>
        )
      })}
    </Box>
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
            {rating.ratingAgency && (
              <LabelValueStack label="Rating agency" value={<Text variant="body2">{rating.ratingAgency}</Text>} />
            )}
            {rating.ratingValue && (
              <LabelValueStack label="Rating" value={<Text variant="body2">{rating.ratingValue}</Text>} />
            )}
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
