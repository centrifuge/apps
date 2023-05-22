import { InteractiveCard, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { Spinner } from './Spinner'

const PriceYieldChart = React.lazy(() => import('./Charts/PriceYieldChart'))

type PoolTokenProps = {
  token: any
  defaultOpen: boolean
  children: React.ReactNode
}

export function PoolToken({ token, defaultOpen, children }: PoolTokenProps) {
  const [showChart, setShowChart] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <InteractiveCard
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      variant={showChart ? 'collapsible' : 'default'}
      icon={<Thumbnail label={token.symbol ?? ''} type="token" />}
      title={
        <Text>
          {token.name} {token.symbol ? `(${token.symbol})` : ''}
        </Text>
      }
      secondaryHeader={children}
    >
      <Stack maxHeight="300px">
        <React.Suspense fallback={<Spinner />}>
          <PriceYieldChart trancheId={token.id} onDataLoaded={setShowChart} renderFallback={false} />
        </React.Suspense>
      </Stack>
    </InteractiveCard>
  )
}
