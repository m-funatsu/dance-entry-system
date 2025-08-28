import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(request: NextRequest) {
  console.log('🎯 [STATUS API] ステータス更新API呼び出し開始')
  
  try {
    // 認証チェック
    console.log('🔐 [STATUS API] 認証チェック開始')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ [STATUS API] 未認証ユーザー')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ [STATUS API] ユーザー認証成功:', user.id)

    // 管理者権限チェック
    console.log('👑 [STATUS API] 管理者権限チェック開始')
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('👤 [STATUS API] ユーザープロフィール:', userProfile)

    if (!userProfile || userProfile.role !== 'admin') {
      console.error('❌ [STATUS API] 管理者権限なし:', { 
        hasProfile: !!userProfile,
        role: userProfile?.role 
      })
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    console.log('✅ [STATUS API] 管理者権限確認済み')

    console.log('📝 [STATUS API] リクエストボディ解析開始')
    const body = await request.json()
    const { entryIds, status } = body
    
    console.log('📦 [STATUS API] リクエストデータ:', {
      entryIds,
      status,
      entryIdsType: typeof entryIds,
      entryIdsLength: Array.isArray(entryIds) ? entryIds.length : 'not array',
      statusType: typeof status
    })

    // 入力値検証
    console.log('🔍 [STATUS API] 入力値検証開始')
    if (!status || !['pending', 'submitted', 'selected', 'rejected'].includes(status)) {
      console.error('❌ [STATUS API] 無効なステータス:', status)
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      console.error('❌ [STATUS API] 無効なエントリーID:', entryIds)
      return NextResponse.json(
        { error: 'Entry IDs are required' },
        { status: 400 }
      )
    }

    console.log('✅ [STATUS API] 入力値検証完了')

    console.log('🔧 [STATUS API] 管理者クライアント作成開始')
    const adminSupabase = createAdminClient()
    console.log('✅ [STATUS API] 管理者クライアント作成完了')

    console.log('💾 [STATUS API] データベース更新開始:', {
      targetEntries: entryIds,
      newStatus: status,
      updateTime: new Date().toISOString()
    })

    // エントリーのステータスを更新
    const { error: entryError } = await adminSupabase
      .from('entries')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', entryIds)

    if (entryError) {
      console.error('❌ [STATUS API] データベース更新エラー:', {
        message: entryError.message,
        code: entryError.code,
        details: entryError,
        hint: entryError.hint,
        targetIds: entryIds
      })
      return NextResponse.json(
        { error: 'Failed to update entry status', details: entryError.message },
        { status: 500 }
      )
    }

    console.log('✅ [STATUS API] データベース更新成功')

    const successResponse = { 
      success: true, 
      message: `${entryIds.length} entries updated successfully`,
      updatedCount: entryIds.length
    }

    console.log('🎉 [STATUS API] 成功レスポンス:', successResponse)
    return NextResponse.json(successResponse)

  } catch (error) {
    console.error('💥 [STATUS API] 予期しないエラー:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}