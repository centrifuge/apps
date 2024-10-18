import React, { useEffect } from 'react'

const ManualKybRedirect: React.FC = () => {
  useEffect(() => {
    window.parent.postMessage('manual.onboarding.completed', '*')
  }, [])

  return <div style={{ display: 'none' }}></div>
}

export default ManualKybRedirect
