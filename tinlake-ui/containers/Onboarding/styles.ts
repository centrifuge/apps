import styled from 'styled-components'

export const Step = styled.div``

export const StepHeader = styled.div`
  display: flex;
  flex-direction: row;
`

export const StepIcon = styled.div`
  width: 40px;
  padding-top: 2px;

  img {
    width: 20px;
    height: 20px;
  }
`

export const StepTitle = styled.div<{ inactive?: boolean }>`
  font-weight: bold;
  font-size: 16px;
  color: ${(props) => (props.inactive ? '#bbb' : '#000')};
`

export const StepBody = styled.div<{ inactive?: boolean }>`
  margin: 20px 20px 20px 10px;
  padding: 2px 0 0 30px;
  border-left: 1px solid #000;
  border-left: ${(props) => (props.inactive ? '1px solid #bbb' : '1px solid #000')};
`
