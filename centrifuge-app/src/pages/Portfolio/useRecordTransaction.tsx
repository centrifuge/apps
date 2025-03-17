import { useState } from 'react'
import { supabase } from '../../../src/supabaseClient'

export interface TransactionData {
  from_address: string
  to_address: string
  tx_hash: string
  chain: string
  amount: number
}

export function useRecordTransaction() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const recordTransaction = async (data: TransactionData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error: supabaseError } = await supabase.from('transactions').insert([data])

    if (supabaseError) {
      setError(supabaseError.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return { recordTransaction, loading, error, success }
}
