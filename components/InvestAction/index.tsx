import * as React from 'react'
import { Box, Button, Layer, Heading } from 'grommet'

interface Props {
  investHtml: string
}

interface State {
  open: boolean
}

class InvestAction extends React.Component<Props, State> {
  state: State = {
    open: false,
  }

  onOpen = () => {
    this.setState({ open: true })
  }

  onClose = () => {
    this.setState({ open: false })
  }

  render() {
    const { investHtml } = this.props

    return (
      <Box>
        <Button primary label="Invest" margin={{ left: 'auto', vertical: 'large' }} onClick={this.onOpen} />
        {this.state.open && (
          <Layer position="center" onClickOutside={this.onClose} onEsc={this.onClose}>
            <Box pad="medium" gap="small" width="large">
              <Heading level={3} margin="none">
                Interested in investing?
              </Heading>
              <div dangerouslySetInnerHTML={{ __html: investHtml }} />
              <Box
                as="footer"
                gap="small"
                direction="row"
                align="center"
                justify="end"
                pad={{ top: 'medium', bottom: 'small' }}
              >
                <Button label="Close" onClick={this.onClose} />
              </Box>
            </Box>
          </Layer>
        )}
      </Box>
    )
  }
}

export default InvestAction
