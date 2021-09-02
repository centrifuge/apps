import { ITinlake } from '@centrifuge/tinlake-js'
import { Heading } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Box, Wrap } from '../../../components/Layout'
import PageTitle from '../../../components/PageTitle'
import { Pool } from '../../../config'
import { AuthState, PermissionsV3 } from '../../../ducks/auth'
import AdminActions from './AdminActions'
import EpochOverview from './EpochOverview'
import ManageMemberlist from './ManageMemberlist'
import TrancheOverview from './TrancheOverview'

interface Props {
  activePool: Pool
  tinlake: ITinlake
  auth?: AuthState
}

const InvestmentsView: React.FC<Props> = (props: Props) => {
  const isAdmin = props.auth?.permissions?.canSetMinimumJuniorRatio
  const canManagePermissions =
    (props.auth?.permissions as PermissionsV3 | undefined)?.canAddToJuniorMemberList ||
    (props.auth?.permissions as PermissionsV3 | undefined)?.canAddToSeniorMemberList

  return (
    <Box mt="large">
      <PageTitle pool={props.activePool} page="Investments" />

      <Wrap gap="medium" alignItems="flex-start" justifyContent="space-between">
        <Box flex="1 1 400px" maxWidth={['100%', '100%', '420px']}>
          <TrancheOverview pool={props.activePool} tinlake={props.tinlake} tranche="senior" />
        </Box>
        <Box flex="1 1 400px" maxWidth={['100%', '100%', '420px']}>
          <TrancheOverview pool={props.activePool} tinlake={props.tinlake} tranche="junior" />
        </Box>
      </Wrap>

      <EpochOverview tinlake={props.tinlake} activePool={props.activePool} />

      {canManagePermissions && (
        <>
          <Heading level="4">Manage members for {props.activePool?.metadata.name}</Heading>
          <ManageMemberlist tinlake={props.tinlake} />
        </>
      )}

      {isAdmin && (
        <>
          <Heading level="4">Admin actions for {props.activePool?.metadata.name}</Heading>
          <AdminActions tinlake={props.tinlake} />
        </>
      )}
    </Box>
  )
}

export default connect((state) => state)(InvestmentsView)
