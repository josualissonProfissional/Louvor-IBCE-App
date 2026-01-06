// Cliente Supabase para uso no frontend (browser)
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

export const createClient = () => createClientComponentClient<Database>()







