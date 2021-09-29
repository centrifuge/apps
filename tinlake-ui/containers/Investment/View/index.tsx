import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { SectionHeading } from '../../../components/Heading'
import { Box, Stack } from '../../../components/Layout'
import PageTitle from '../../../components/PageTitle'
import { Pool } from '../../../config'
import { AuthState, PermissionsV3 } from '../../../ducks/auth'
import AdminActions from './AdminActions'
import EpochOverview from './EpochOverview'
import ManageMemberlist from './ManageMemberlist'
import TrancheOverview from './TrancheOverview'

interface Props {
  activePool: Pool
  auth?: AuthState
}

const InvestmentsView: React.FC<Props> = (props: Props) => {
  const isAdmin = props.auth?.permissions?.canSetMinimumJuniorRatio
  const canManagePermissions =
    (props.auth?.permissions as PermissionsV3 | undefined)?.canAddToJuniorMemberList ||
    (props.auth?.permissions as PermissionsV3 | undefined)?.canAddToSeniorMemberList

  return (
    <Box mt="xlarge">
      <PageTitle pool={props.activePool} page="Investments" />
      <Stack gap={['medium', 'xxxlarge']}>
        <GridCol2>
          <Box flex="1">
            <TrancheOverview pool={props.activePool} tranche="senior" />
          </Box>
          <Box flex="1">
            <TrancheOverview pool={props.activePool} tranche="junior" />
          </Box>
        </GridCol2>

        <EpochOverview activePool={props.activePool} />

        {canManagePermissions && (
          <Stack gap="medium">
            <SectionHeading>Manage members for {props.activePool?.metadata.name}</SectionHeading>
            <ManageMemberlist />
          </Stack>
        )}

        {isAdmin && (
          <Stack gap="medium">
            <SectionHeading>Admin actions for {props.activePool?.metadata.name}</SectionHeading>
            <AdminActions />
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

const GridCol2 = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(466px, 1fr));
  justify-content: space-between;
  gap: ${(p) => p.theme.space.medium}px;

  @media (max-width: ${(p) => p.theme.breakpoints.small}) {
    grid-template-columns: repeat(auto-fill, 100%);
  }
`

export default connect((state) => state)(InvestmentsView)
