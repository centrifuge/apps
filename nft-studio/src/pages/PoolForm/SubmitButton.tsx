import { Button } from '@centrifuge/fabric'
import { useFormikContext } from 'formik'
import React from 'react'

export const SubmitButton: React.FC = () => {
  const { isValid } = useFormikContext()
  return (
    <Button variant="contained" type="submit" disabled={!isValid}>
      Create
    </Button>
  )
}
