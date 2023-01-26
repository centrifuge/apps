import { Box, Button, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { useQueryErrorResetBoundary } from 'react-query'
import { Spinner } from './Spinner'

type ErrorCb = (args: { error: any; retry: () => void }) => React.ReactElement | null

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
  renderError?: ErrorCb
}

export function LoadBoundary({ children, fallback, renderError }: Props) {
  return (
    <React.Suspense
      fallback={
        fallback || (
          <Box mt={8}>
            <Spinner />
          </Box>
        )
      }
    >
      <ErrorBoundary renderError={renderError}>{children}</ErrorBoundary>
    </React.Suspense>
  )
}

function ErrorBoundary({ children, renderError }: { children: React.ReactNode; renderError?: ErrorCb }) {
  const { reset } = useQueryErrorResetBoundary()
  return (
    <ReactErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) =>
        renderError ? (
          renderError({ error, retry: resetErrorBoundary })
        ) : (
          <Stack gap={2} mt={8} alignItems="center">
            <Text>Something went wrong</Text>
            <Button onClick={() => resetErrorBoundary()}>Try again</Button>
          </Stack>
        )
      }
    >
      {children}
    </ReactErrorBoundary>
  )
}
