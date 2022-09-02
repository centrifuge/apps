import * as React from 'react'

export const ClientOnlyRender: React.FC = ({ children }) => {
  const [shouldRender, setRender] = React.useState(false)

  React.useEffect(() => {
    setRender(true)
  }, [])
  return shouldRender ? <>{children}</> : null
}
