import styled from 'styled-components'

export const StyledApp = styled.div`
  /*
   * Workaround for too light input:disabled text. Should be fixed by using a
   * dedicated component at some point for displaying readonly values.
   */
  input:disabled {
    opacity: 0.5;
  }
`
