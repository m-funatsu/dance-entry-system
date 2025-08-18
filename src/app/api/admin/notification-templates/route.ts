import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching notification templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }
    
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error in GET /api/admin/notification-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const { name, description, subject, body: templateBody, is_active } = body
    
    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const { data: template, error } = await supabase
      .from('notification_templates')
      .insert([
        {
          name,
          description,
          subject,
          body: templateBody,
          is_active: is_active ?? true,
        }
      ])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating notification template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }
    
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error in POST /api/admin/notification-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}