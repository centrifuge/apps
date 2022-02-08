import React from 'react'
import ReactDOM from 'react-dom'
import { DebugFlags } from './components/DebugFlags'
import { Root } from './components/Root'

ReactDOM.render(
  <React.StrictMode>
    <DebugFlags>
      <Root />
    </DebugFlags>
  </React.StrictMode>,
  document.getElementById('root')
)
