import React, { FunctionComponent } from 'react'
import styled from 'styled-components'
import { Image } from 'grommet'

interface Props {
  [key: string]: any
}

const ChevronRight: FunctionComponent<Props> = (props) => {
  return <Img src="/static/chevron-right.svg" style={{ width: 130 }} {...props} />
}

const Img = styled(Image)`
  width: 24px;
  height: 24px;
`
export default ChevronRight
