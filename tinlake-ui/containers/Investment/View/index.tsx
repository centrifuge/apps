import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Heading } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
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
    <Box margin={{ top: 'medium' }}>
      <PageTitle pool={props.activePool} page="Investments" />

      <Box direction="row" justify="between" gap="medium" margin={{ bottom: 'large' }} wrap align="start">
        <TrancheOverview pool={props.activePool} tinlake={props.tinlake} tranche="senior" />
        <TrancheOverview pool={props.activePool} tinlake={props.tinlake} tranche="junior" />
      </Box>

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
