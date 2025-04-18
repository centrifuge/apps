import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.REACT_APP_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.REACT_APP_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
