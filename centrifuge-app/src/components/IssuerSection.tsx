import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  Box,
  IconBalanceSheet,
  IconCashflow,
  IconChevronRight,
  IconProfitAndLoss,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
import styled from 'styled-components'
import { ExecutiveSummaryDialog } from './Dialogs/ExecutiveSummaryDialog'
import { AnchorPillButton, PillButton } from './PillButton'
import { RouterTextLink } from './TextLink'

const SUBTLE_GRAY = '#91969b21'

type IssuerSectionProps = {
  metadata: Partial<PoolMetadata> | undefined
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

export function ReportDetails({ metadata }: IssuerSectionProps) {
  const cent = useCentrifuge()
  const { pathname } = useLocation()
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
