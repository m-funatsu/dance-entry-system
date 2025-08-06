import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .in('key', [
      'basic_info_deadline',
      'music_info_deadline',
      'consent_form_deadline',
      'program_info_deadline',
      'semifinals_deadline',
      'finals_deadline',
      'sns_deadline',
      'optional_request_deadline'
    ])
    .order('key')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ settings: data })
}