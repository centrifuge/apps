import { createGlobalStyle } from 'styled-components'

export const StyledApp = createGlobalStyle`
  /*
   * Workaround for too light input:disabled text. Should be fixed by using a
   * dedicated component at some point for displaying readonly values.
   */
  input:disabled {
    opacity: 0.5;
  }

  .bn-onboard-custom.bn-onboard-modal {
    z-index: 2;
  }

  .bn-onboard-custom.bn-onboard-modal {
    font-family: AvenirNextLTW01, 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
      sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  }
  
  .bn-onboard-custom.bn-onboard-modal-content-header-heading, .bn-onboard-custom.bn-onboard-icon-button {
    color: #000;
  }
  
  .bn-onboard-custom.bn-onboard-select-wallet-info {
    color: #2762FF !important;
    font-size: 14px !important;
  }

  .bn-onboard-custom.bn-onboard-prepare-button {
    background: #000;
    color: #fff;
    border: none;

    &:hover {
      background: #2762FF;
    }
  }

  .bn-onboard-custom.bn-onboard-prepare-button-right {
    background: #fff;
    border: 1px solid #000;
    color: #000;

    &:hover {
      background: #fff;
      border: 1px solid #2762FF;
      color: #2762FF;
    }
  }
`
