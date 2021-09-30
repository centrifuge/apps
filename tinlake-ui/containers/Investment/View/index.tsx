import * as React from 'react'
import { connect } from 'react-redux'
import { SectionHeading } from '../../../components/Heading'
import { Box, Grid, Stack } from '../../../components/Layout'
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
        <Grid equalColumns minColumnWidth={['100%', 466]} gap="large">
          <TrancheOverview pool={props.activePool} tranche="senior" />

          <TrancheOverview pool={props.activePool} tranche="junior" />
        </Grid>

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

export default connect((state) => state)(InvestmentsView)
