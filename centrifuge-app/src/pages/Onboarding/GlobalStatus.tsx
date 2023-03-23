import { Button } from '@centrifuge/fabric'
import { useHistory } from 'react-router-dom'
import { ActionBar, Content, ContentHeader } from '../../components/Onboarding'

export const GlobalStatus = () => {
  const history = useHistory()

  return (
    <>
      <Content>
        <ContentHeader
          title="Thanks for verifying your identity"
          body="Please click the button below to access the pools available for investment."
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
