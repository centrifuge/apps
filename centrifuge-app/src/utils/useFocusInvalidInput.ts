import { FormikProps, getIn } from 'formik'
import * as React from 'react'

// Focuses the first invalid input upon form submission
export function useFocusInvalidInput(form: FormikProps<any>, ref: React.RefObject<HTMLFormElement | null>) {
  React.useEffect(() => {
    if (form.submitCount === 0) return
    const nodes = ref.current?.querySelectorAll<HTMLInputElement>('input,textarea')
    if (!nodes?.length) return
    for (const node of nodes) {
      if (!node.name) continue
      const error = getIn(form.errors, node.name)
      if (error) {
        node.focus()
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.submitCount])
}
