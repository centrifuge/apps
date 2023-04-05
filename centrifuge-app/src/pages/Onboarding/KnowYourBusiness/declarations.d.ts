export type Indentity = {
  businessName: string
  email: string
  registrationNumber: string
  jurisdictionCode: string
  regionCode?: string
}

/**
 * docs: https://ra.shuftipro.com/questionnaire-docs/response
 */
type DocumentTypes = ('id_card' | 'driving_license' | 'passport' | 'bank_statement')[]

export type KYBResponse = {
  reference: string
  event: `request.${'pending' | 'accepted' | 'declined'}`
  verification_url: string
  email: string | null
  country: string | null

  error?: {
    service: string
    key: string
    message: string
  }
  token?: string
  verification_result: 1 | 0 | null // 1 = accepted / 0 = declined / null = not processed

  /**
   * This object will be returned in case of verification.accepted or verification.declined.
   * This object will include all the gathered data in a request process.
   */
  verification_data?: {
    face: {
      duplicate_account_detected: number
    }
    document: {
      name: {
        first_name: string
        middle_name: string | null
        last_name: string
      }
      dob: string
      age: number
      issue_date: string
      expiry_date: string
      document_number: string
      selected_type: DocumentTypes
      supported_types: DocumentTypes
      gender: 'M' | 'F'
    }
    address: {
      name: {
        first_name: string
        middle_name: string | null
        last_name: string
      }
      full_address: string
      selected_type: DocumentTypes
      supported_types: DocumentTypes
    }
  }

  /**
   * This object will be returned in case of verification.accepted or verification.declined
   */
  info?: {
    Agent: unknown // provides information about the device and browser of the end-user.
    Geolocation: unknown // provides information about the geographical location of the end-user.
  }

  /**
   * This object will be returned in case of verification.accepted or verification.declined.
   * This object contains the additional data extracted by Shufti Pro on the document.
   */
  additional_data?: unknown

  /**
   * This array contains status codes of all declined verification reasons.
   * It will return only for verification.declined.
   */
  declined_reason: number[]

  /**
   * This object contains status codes of declined reasons for each service separately.
   * Each service object will contain an array of status codes for declined reasons specific to that service.
   * It will return only for verification.declined.
   */
  services_declined_codes?: { [key: number]: number[] }
}
