import { object, string } from 'yup'

export const validationSchema = object({
  email: string().email('Please enter a valid email address').required('Please enter an email address'),
  businessName: string().required('Please enter the business name'),
  registrationNumber: string().required('Please enter the business registration number'),
  jurisdictionCode: string().required('Please select the business country of incorporation'),
  regionCode: string().when('jurisdictionCode', {
    is: (jurisdictionCode: string) => jurisdictionCode === 'us' || jurisdictionCode === 'ca',
    then: string().required('Please select your region code'),
  }),
})
