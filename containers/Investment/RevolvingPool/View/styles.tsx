import styled from 'styled-components'
import { Box, Text } from 'grommet'

export const Description = styled(Text)`
  color: #777;
  font-size: 14px;
`

export const ExplainerCard = styled(Box)`
  background: #f2f2f2;
  padding: 24px;
  color: #555;
  border-radius: 8px;
`

export const TokenLogo = styled.img`
  vertical-align: middle;
  margin: 0 8px 0 0;
  width: 16px;
  height: 16px;
`

export const Info = styled.div`
  margin-top: 16px;
  background: #f5f5f5;
  position: relative;
  left: -24px;
  width: calc(100% + 48px);
  padding: 24px;

  h6 {
    margin-top: 0;
    color: #000;
  }
`

export const Warning = styled.div`
  margin-top: 16px;
  background: #fff5da;
  position: relative;
  left: -24px;
  width: calc(100% + 48px);
  padding: 24px;

  h6 {
    margin-top: 0;
    color: #fcba59;
  }
`
