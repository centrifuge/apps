import { Button } from '@centrifuge/fabric'
import * as React from 'react'
import { PageSection } from '../../../components/PageSection'

export function ThirdPartyPricing() {
  return (
    <PageSection
      title="Third-party pricing"
      headerRight={
        <Button variant="secondary" small>
          Set up
        </Button>
      }
      collapsible
    >
      content
    </PageSection>
  )
}
