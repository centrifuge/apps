import { Button } from '@centrifuge/fabric'
import { useHistory } from 'react-router-dom'
import { ActionBar, Content, ContentHeader } from '.'

export const ChoosePool = () => {
  const history = useHistory()

  return (
    <>
      <Content>
        <ContentHeader
          title="Choose a pool"
          body="Your identity has been verified! Click the button below to view the possible pools to finish onboarding."
        />
      </Content>

      <ActionBar>
        <Button
          onClick={() => {
            history.push('/pools')
          }}
        >
          View Pools
        </Button>
      </ActionBar>
    </>
  )
}
