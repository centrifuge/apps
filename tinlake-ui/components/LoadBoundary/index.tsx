import { ErrorBoundary } from 'react-error-boundary'
import { QueryErrorResetBoundary } from 'react-query'

export const LoadBoundary: React.FC = ({ children }) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => <Fallback reset={resetErrorBoundary} />}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

const Fallback: React.FC<{ reset: () => void }> = ({ reset }) => {
  return (
    <div>
      <div>something went wrong</div>
      <button
        onClick={() => {
          reset()
        }}
      >
        retry
      </button>
    </div>
  )
}
