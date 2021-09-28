import { Box, Text } from 'grommet'
import styled from 'styled-components'

export const FlexWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;

  @media (max-width: 899px) {
    flex-direction: column;
    & > div:first-child {
      margin-bottom: 40px;
    }
  }
`

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
  width: 24px;
  height: 24px;
`

export const OrderSteps = styled.img`
  display: block;
  width: 100%;
  margin: 0 auto;
`

export const Sidenote = styled.div`
  color: #888;
  font-size: 12px;
`

export const SignIcon = styled.img`
  vertical-align: middle;
  margin: 0 8px 0 0;
  width: 24px;
  height: 24px;
  position: relative;
  top: -2px;
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

export const PoolValueLineLeft = styled.div`
  width: 145px;
  border-top: 1px solid #d8d8d8;
  border-left: 1px solid #d8d8d8;
  border-top-left-radius: 6px;
  margin-top: 40px;
`

export const PoolValueLineRight = styled.div`
  width: 145px;
  border-top: 1px solid #d8d8d8;
  border-right: 1px solid #d8d8d8;
  border-top-right-radius: 6px;
  margin-top: 40px;
`

export const BalanceSheetDiagram = styled(Box)`
  flex: 1 1 10%;
  @media (max-width: 899px) {
    display: none;
  }
`

export const BalanceSheetDiagramLeft = styled(Box)`
  width: 50%;
  display: flex;
  flex-direction: column;
`

export const BalanceSheetMidLine = styled.div`
  border-bottom: 1px solid #d8d8d8;
  flex: 1;
`

export const BalanceSheetFiller = styled.div`
  flex: 1;
`

export const BalanceSheetDiagramRight = styled(Box)`
  border-bottom: 1px solid #d8d8d8;
  border-left: 1px solid #d8d8d8;
  border-bottom-left-radius: 12px;
  border-top-left-radius: 12px;
  border-top: 1px solid #d8d8d8;
  width: 50%;
  height: 68%;
  position: relative;
  top: 14%;
`

export const DividerTop = styled.div`
  border-bottom: 1px solid #d8d8d8;
  max-width: 80%;
  margin: 0 0 16px 10%;
`

export const DividerBottom = styled.div`
  border-top: 1px solid #d8d8d8;
  max-width: 80%;
  margin: 0 0 16px 10%;
`

export const DividerInner = styled.div`
  border-right: 1px solid #d8d8d8;
  width: 50%;
`

export const MinTimeRemaining = styled.div`
  margin-top: 12px;
`

export const Caret = styled.div`
  position: relative;
  display: inline-block;
  top: 6px;
  height: 24px;
  margin-left: 10px;
  svg {
    transition: 200ms;
  }
`
