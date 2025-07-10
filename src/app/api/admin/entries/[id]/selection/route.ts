import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const entryId = params.id
    const body = await request.json()
    const { score, comments, status } = body

    // 入力値検証
    if (!status || !['pending', 'submitted', 'selected', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    if (score !== null && score !== undefined && (score < 1 || score > 10)) {
      return NextResponse.json(
        { error: 'Score must be between 1 and 10' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // 既存の選考結果を確認
    const { data: existingSelection } = await adminSupabase
      .from('selections')
      .select('id')
      .eq('entry_id', entryId)
      .single()

    if (existingSelection) {
      // 既存の選考結果を更新
      const { error: selectionError } = await adminSupabase
        .from('selections')
        .update({
          score: score ? parseInt(String(score)) : null,
          comments,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSelection.id)

      if (selectionError) {
        console.error('Selection update error:', selectionError)
        return NextResponse.json(
          { error: 'Failed to update selection' },
          { status: 500 }
        )
      }
    } else {
      // 新しい選考結果を作成
      const { error: selectionError } = await adminSupabase
        .from('selections')
        .insert([
          {
            entry_id: entryId,
            admin_id: user.id,
            score: score ? parseInt(String(score)) : null,
            comments,
            status,
          }
        ])

      if (selectionError) {
        console.error('Selection insert error:', selectionError)
        return NextResponse.json(
          { error: 'Failed to create selection' },
          { status: 500 }
        )
      }
    }

    // エントリーのステータスを更新
    const { error: entryError } = await adminSupabase
      .from('entries')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)

    if (entryError) {
      console.error('Entry status update error:', entryError)
      return NextResponse.json(
        { error: 'Failed to update entry status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Selection updated successfully' 
    })

  } catch (error) {
    console.error('Selection update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}