import { FormField } from 'grommet'
import styled from 'styled-components'

export const Step = styled.div``

export const StepHeader = styled.div`
  display: flex;
  flex-direction: row;
`

export const StepIcon = styled.div<{ inactive?: boolean }>`
  width: 40px;
  padding-top: 2px;
  background: ${(props) => (props.inactive ? "url('/static/circle-inactive.svg')" : "url('/static/circle.svg')")};
  background-repeat: no-repeat;

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

export const FormFieldWithoutBorder = styled(FormField)`
  > div {
    border-bottom-color: rgba(0, 0, 0, 0);
    padding: 0;
  }

  > span {
    margin: 12px 0 0 34px;
    font-weight: bold;
  }
`
