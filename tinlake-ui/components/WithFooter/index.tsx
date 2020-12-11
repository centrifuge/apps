import { Box } from 'grommet'
import React, { PropsWithChildren } from 'react'
import Footer from '../Footer'
class WithFooter extends React.Component<PropsWithChildren<{}>> {
  render() {
    return (
      <>
        <Box style={{ minHeight: 'calc(100vh - 120px)' }} background="rgb(249, 249, 249)">
          {this.props.children}
        </Box>
        <Footer />
      </>
    )
  }
}

export default WithFooter
