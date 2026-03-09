import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lpsjyinzvxctyamxzkdv.supabase.co'
// Pega aquí tu clave Anon Key real entre las comillas
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwc2p5aW56dnhjdHlhbXh6a2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzAzOTcsImV4cCI6MjA4NjEwNjM5N30.-nW3nfluS-tej0gego_zpYE3K1h5-h5VR9vQ9HAsmHk' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)