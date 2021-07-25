import { ITinlake } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import * as React from 'react'

interface Props {
  tinlake: ITinlake
}

const PoolManagement: React.FC<Props> = (props: Props) => {
  return <Box margin={{ top: 'medium' }}>Pool management</Box>
}

export default PoolManagement
