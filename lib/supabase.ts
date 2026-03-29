import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qgrcsrvbmtudcwwnkjsn.supabase.co'
// Esta es la clave corregida (sin repeticiones)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncmNzcnZibXR1ZGN3d25ranNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDA5NTEsImV4cCI6MjA5MDMxNjk1MX0.1-cjBKsMg4sTlA6WI9nPdWpHVWZZ9J1iK0QOIsa-A7c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
