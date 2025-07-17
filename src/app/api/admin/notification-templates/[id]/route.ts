import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    
    const { data: template, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching notification template:', error)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error in GET /api/admin/notification-templates/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    const body = await request.json()
    
    const { name, description, subject, body: templateBody, category, is_active } = body
    
    if (!name || !subject || !templateBody || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const { data: template, error } = await supabase
      .from('notification_templates')
      .update({
        name,
        description,
        subject,
        body: templateBody,
        category,
        is_active,
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating notification template:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }
    
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error in PUT /api/admin/notification-templates/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await params
    
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting notification template:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/notification-templates/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}