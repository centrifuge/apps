import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import {
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
import { formatPercentage } from '../utils/formatting'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { LabelValueStack } from './LabelValueStack'
import { AnchorPillButton, PillButton } from './PillButton'
import { RouterTextLink } from './TextLink'

const SUBTLE_GRAY = '#91969b21'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
}

const reportLinks = [
  { label: 'Balance sheet', href: '/balance-sheet', icon: <IconBalanceSheet color="backgroundPrimary" /> },
  { label: 'Profit & loss', href: '/profit-and-loss', icon: <IconProfitAndLoss color="backgroundPrimary" /> },
  { label: 'Cashflow statement', href: '/cash-flow-statement', icon: <IconCashflow color="backgroundPrimary" /> },
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

export function ReportDetails({ metadata }: IssuerSectionProps) {
  const pathname = useLocation().pathname
  const report = metadata?.pool?.reports?.[0]
  return (
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
            <IconChevronRight color="backgroundPrimary" />
          </Box>
        ))}
      </Box>

      {report && <PoolAnalysis metadata={metadata} />}
    </>
  )
}

export function IssuerDetails({ metadata }: IssuerSectionProps) {
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

  const formatCamelCase = (text: string | undefined) => {
    if (!text) return
    return text.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
  }

  return (
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
      <Box pt={4} display="flex" justifyContent="space-between">
        <Box>
          <Text variant="heading2">{metadata?.pool?.issuer.name}</Text>
          <Text variant="body2" style={{ marginTop: '12px' }}>
            {metadata?.pool?.issuer.description}
          </Text>
        </Box>
        {metadata?.pool?.issuer?.categories?.length ? (
          <Box width="50%" bg="white" padding="8px" borderRadius={10} ml={1}>
            {metadata?.pool?.issuer?.categories.map((category) => (
              <Box display="flex" justifyContent="space-between" padding={1}>
                <Text color="textSecondary" variant="body2" style={{ minWidth: 120, textTransform: 'capitalize' }}>
                  {formatCamelCase(category.customType) || formatCamelCase(category.type)}
                </Text>
                <Text variant="body2" style={{ fontWeight: 500 }}>
                  {category.type.includes('Rate') ? formatPercentage(category.value) : category.value}
                </Text>
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>
      <ExecutiveSummaryDialog
        issuerName={metadata?.pool?.issuer.name ?? ''}
        href={cent.metadata.parseMetadataUrl(metadata?.pool?.links.executiveSummary?.uri ?? '')}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
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

  return rating?.ratingAgency || rating?.ratingValue || rating?.ratingReportUrl ? (
    <Stack gap={1}>
      <Text variant="heading2">Pool rating</Text>
      <Shelf flexDirection="column" alignItems="flex-start">
        <Shelf gap={1}>
          {rating.ratingAgency && (
            <LabelValueStack label="Rating agency" value={<Text variant="body2">{rating.ratingAgency}</Text>} />
          )}
          {rating.ratingValue && (
            <LabelValueStack label="Rating" value={<Text variant="body2">{rating.ratingValue}</Text>} />
          )}
        </Shelf>
      </Shelf>
      <Shelf>
        {rating?.ratingReportUrl && (
          <AnchorButton href={rating.ratingReportUrl} target="_blank" variant="secondary" icon={IconExternalLink}>
            View full report
          </AnchorButton>
        )}
      </Shelf>
    </Stack>
  ) : null
}

export const PoolAnalysis = ({ metadata, inverted }: IssuerSectionProps & { inverted?: boolean }) => {
  const report = metadata?.pool?.reports?.[0]
  return report?.author?.name || report?.author?.title ? (
    <Stack gap={1}>
      <Text color={inverted ? 'textPrimary' : 'white'} variant={inverted ? 'heading2' : 'heading4'}>
        Pool analysis
      </Text>
      <Stack gap={0}>
        <Text variant="body3" color="textSecondary">
          Reviewer: {report?.author?.name || 'N/A'}
        </Text>
        <Text variant="body3" color="textSecondary">
          Title: {report?.author?.title || 'N/A'}
        </Text>
      </Stack>
    </Stack>
  ) : null
}
