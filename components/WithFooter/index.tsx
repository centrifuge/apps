import React, { PropsWithChildren } from 'react'
import { Box } from 'grommet'
import Footer from '../Footer'
class WithFooter extends React.Component<PropsWithChildren<{}>> {
  render() {
    return (
      <>
        <Box style={{ minHeight: 'calc(100vh - 150px)' }}>{this.props.children}</Box>
        <Footer />
      </>
    )
  }
}

export default WithFooter
