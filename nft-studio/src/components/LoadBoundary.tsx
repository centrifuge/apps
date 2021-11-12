import { Box, Button, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { useQueryErrorResetBoundary } from 'react-query'
import { Spinner } from './Spinner'

export const LoadBoundary: React.FC = ({ children }) => {
  return (
    <React.Suspense
      fallback={
        <Box mt={8}>
          <Spinner />
        </Box>
      }
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </React.Suspense>
  )
}

const ErrorBoundary: React.FC = ({ children }) => {
  const { reset } = useQueryErrorResetBoundary()
  return (
    <ReactErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <Stack gap={2} mt={8} alignItems="center">
          <Text>Something went wrong</Text>
          <Button onClick={() => resetErrorBoundary()}>Try again</Button>
        </Stack>
      )}
    >
      {children}
    </ReactErrorBoundary>
  )
}
