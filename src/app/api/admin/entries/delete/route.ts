import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
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
    const { entryIds } = body

    // 入力値検証
    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { error: 'Entry IDs are required' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // 削除前に関連データを取得
    const { data: entriesData } = await adminSupabase
      .from('entries')
      .select('id, user_id, entry_files(id, file_path)')
      .in('id', entryIds)

    if (!entriesData || entriesData.length === 0) {
      return NextResponse.json(
        { error: 'No entries found to delete' },
        { status: 404 }
      )
    }

    // 削除処理をトランザクション的に実行
    const deletePromises = []

    // 1. 関連する選考結果を削除
    deletePromises.push(
      adminSupabase
        .from('selections')
        .delete()
        .in('entry_id', entryIds)
    )

    // 2. 関連するファイル情報を削除
    deletePromises.push(
      adminSupabase
        .from('entry_files')
        .delete()
        .in('entry_id', entryIds)
    )

    // 3. エントリーを削除
    deletePromises.push(
      adminSupabase
        .from('entries')
        .delete()
        .in('id', entryIds)
    )

    // 全ての削除処理を実行
    const results = await Promise.all(deletePromises)

    // エラーチェック
    for (const result of results) {
      if (result.error) {
        console.error('Delete error:', result.error)
        return NextResponse.json(
          { error: 'Failed to delete entries' },
          { status: 500 }
        )
      }
    }

    // ファイルストレージからの削除（失敗しても処理を続行）
    const fileDeletePromises = []
    for (const entry of entriesData) {
      if (entry.entry_files && entry.entry_files.length > 0) {
        for (const file of entry.entry_files) {
          if (file.file_path) {
            fileDeletePromises.push(
              adminSupabase.storage
                .from('files')
                .remove([file.file_path])
            )
          }
        }
      }
    }

    if (fileDeletePromises.length > 0) {
      try {
        await Promise.all(fileDeletePromises)
      } catch (error) {
        console.warn('File deletion warning:', error)
        // ファイル削除の失敗は致命的ではないため、警告として扱う
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${entryIds.length} entries deleted successfully`,
      deletedCount: entryIds.length
    })

  } catch (error) {
    console.error('Entry deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}