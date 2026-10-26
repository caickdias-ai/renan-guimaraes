import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_renanguimaraes_SUPABASE_URL || process.env.SUPABASE_URL || process.env.renanguimaraes_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_renanguimaraes_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_renanguimaraes_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.renanguimaraes_SUPABASE_PUBLISHABLE_KEY || process.env.renanguimaraes_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
