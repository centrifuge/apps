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
import styled, { useTheme } from 'styled-components'
import { formatPercentage } from '../utils/formatting'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { LabelValueStack } from './LabelValueStack'
import { AnchorPillButton, PillButton } from './PillButton'
import { AnchorTextLink, RouterTextLink } from './TextLink'

const SUBTLE_GRAY = '#91969b21'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
}

const StyledBox = styled(Box)`
  padding: 24px;
  &:hover {
    background: ${SUBTLE_GRAY};
    border-radius: 0px;
  }
`

const HoverBox = styled(StyledBox)`
  padding: 8px 22px;
  background-color: ${SUBTLE_GRAY};
  border: 3px solid transparent;
  border-radius: 4px;
  &:hover {
    border-radius: 4px;
    border-color: #91969b1a;
  }
`

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

const StyledAnchorTextLink = styled(AnchorTextLink)`
  color: white;
  font-size: 14px;
  text-decoration: unset;
  :active {
    color: white;
  }
  :visited {
    color: white;
  }
  :hover {
    text-decoration: underline;
  }
`

export function ReportDetails({ metadata }: IssuerSectionProps) {
  const pathname = useLocation().pathname
  const report = metadata?.pool?.reports?.[0]
  const theme = useTheme()

  const reportLinks = [
    { label: 'Balance sheet', href: '/balance-sheet', icon: <IconBalanceSheet color={theme.colors.textSecondary} /> },
    {
      label: 'Profit & loss',
      href: '/profit-and-loss',
      icon: <IconProfitAndLoss color={theme.colors.textSecondary} />,
    },
    {
      label: 'Cash flow statement',
      href: '/cash-flow-statement',
      icon: <IconCashflow color={theme.colors.textSecondary} />,
    },
  ]
  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text color="white" variant="heading4">
          Reports
        </Text>
        <HoverBox backgroundColor={SUBTLE_GRAY}>
          <StyledRouterTextLink to={`${pathname}/reporting`}>View all</StyledRouterTextLink>
        </HoverBox>
      </Box>

      <Box marginY={2} backgroundColor={SUBTLE_GRAY} borderRadius={10}>
        {reportLinks.map((link, i) => (
          <StyledRouterTextLink to={`${pathname}/reporting${link.href}`} key={`${link.label}-${i}`}>
            <StyledBox
              borderBottom={i === reportLinks.length - 1 ? null : `2px solid ${SUBTLE_GRAY}`}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center">
                {link.icon}
                <Text color="white" style={{ marginLeft: 8 }}>
                  {link.label}
                </Text>
              </Box>
              <IconChevronRight color="white" />
            </StyledBox>
          </StyledRouterTextLink>
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
      label: 'Executive summary',
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
            maxWidth={100}
            maxHeight={28}
            alt={metadata?.pool?.issuer.name}
            src={cent.metadata.parseMetadataUrl(metadata?.pool?.issuer.logo?.uri)}
          />
        )}
        <Links links={links} />
      </Shelf>
      <Box pt={4} display="flex" justifyContent="space-between">
        <Box width={metadata?.pool?.issuer?.categories?.length ? '50%' : '100%'} marginRight={3}>
          <Text variant="heading2">{metadata?.pool?.issuer.name}</Text>
          <Text variant="body2" style={{ marginTop: '12px', lineHeight: '22px', letterSpacing: '-0.14px' }}>
            {metadata?.pool?.issuer.description}
          </Text>
        </Box>
        {metadata?.pool?.issuer?.categories?.length ? (
          <Box width="50%" bg="white" padding={2} borderRadius={10} ml={1} height="min-content">
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
            <PillButton key={`${link.label} ${index}`} variant="regular" onClick={link.onClick}>
              {link.label}
            </PillButton>
          )
        }

        return (
          <AnchorPillButton
            style={{ marginRight: 8 }}
            variant="regular"
            key={`${link.label} ${index}`}
            href={link.href}
          >
            {link.label}
          </AnchorPillButton>
        )
      })}
    </Box>
  )
}

export function RatingDetails({ metadata }: IssuerSectionProps) {
  const ratings = metadata?.pool?.poolRatings
  const cent = useCentrifuge()

  return ratings?.length ? (
    <Stack gap={1}>
      <Text variant="heading2">Pool rating</Text>
      <Shelf flexDirection="column" alignItems="flex-start" gap={2}>
        {ratings?.map((rating) => {
          return (
            <Stack gap={1} key={rating.agency}>
              <Shelf flexDirection="column" alignItems="flex-start">
                <Shelf gap={1}>
                  {rating.agency && (
                    <LabelValueStack label="Rating agency" value={<Text variant="body2">{rating.agency}</Text>} />
                  )}
                  {rating.value && (
                    <LabelValueStack label="Rating" value={<Text variant="body2">{rating.value}</Text>} />
                  )}
                </Shelf>
              </Shelf>
              <Shelf gap={2}>
                {rating?.reportUrl && (
                  <AnchorButton href={rating.reportUrl} target="_blank" variant="secondary" icon={IconExternalLink}>
                    View full report
                  </AnchorButton>
                )}
                {rating?.reportFile && (
                  <AnchorButton
                    href={cent.metadata.parseMetadataUrl(rating.reportFile.uri)}
                    target="_blank"
                    variant="secondary"
                    icon={IconExternalLink}
                  >
                    Download report
                  </AnchorButton>
                )}
              </Shelf>
            </Stack>
          )
        })}
      </Shelf>
    </Stack>
  ) : null
}

export const PoolAnalysis = ({ metadata, inverted }: IssuerSectionProps & { inverted?: boolean }) => {
  const report = metadata?.pool?.reports?.[0]
  // Not sure why some pools have N/A, it should be empty but this is a fix for those pools in the meantime
  const isEmpty = report?.author.name === 'N/A'

  console.log(report)
  return report?.author?.name || report?.author?.title ? (
    isEmpty ? null : (
      <Stack gap={1}>
        <StyledAnchorTextLink color={inverted ? 'textPrimary' : 'white'} href={report.uri}>
          Pool analysis
        </StyledAnchorTextLink>
        <Stack gap={0}>
          <Text variant="body3" color="textSecondary">
            Reviewer: {report?.author?.name || 'N/A'}
          </Text>
          <Text variant="body3" color="textSecondary">
            Title: {report?.author?.title || 'N/A'}
          </Text>
        </Stack>
      </Stack>
    )
  ) : null
}
