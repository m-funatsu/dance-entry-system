import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { entryIds, status } = body

    // 入力値検証
    if (!status || !['pending', 'submitted', 'selected', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { error: 'Entry IDs are required' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // エントリーのステータスを更新
    const { error: entryError } = await adminSupabase
      .from('entries')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', entryIds)

    if (entryError) {
      console.error('Entry status update error:', entryError)
      return NextResponse.json(
        { error: 'Failed to update entry status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: `${entryIds.length} entries updated successfully`,
      updatedCount: entryIds.length
    })

  } catch (error) {
    console.error('Entry status update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}